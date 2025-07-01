(module

    ;; MARK: JS IMPORTS

    ;; This function will be called for each collision that is detected.
    (import "j" "handleCollision" (func $handleCollision (param $idA i32) (param $idB i32) (param $normX f64) (param $normY f64) (param $dist f64)))

    ;; This will be called on each possible collision returned from the
    ;; sweepandprune to filter before the GJK code runs.
    (import "j" "checkCollisionIgnore" (func $checkCollisionIgnore (param $idA i32) (param $idB i32) (result i32)))

    ;; Called to check if the object is "active" i.e. not paused.
    (import "j" "isObjActive" (func $isObjActive (param $id i32) (result i32)))

    ;; Called to get the local collider. It returns the type tag of the collider,
    ;; and writes data to the scratchpad.
    (import "j" "getLocalCollider" (func $getLocalCollider (param $id i32) (result i32)))

    ;; MARK: MEMORY LAYOUT

    ;; initialize the workspace
    (global $DEFAULT_PAGE_SIZE i32
        (i32.const 65536))
    (memory 1)
    (global $SCRATCHPAD_SIZE i32
        (i32.const 64))

    ;; js helper function: write float at particular index
    (func (export "setScratchpad") (param $index i32) (param $number f64)
        (local $address i32)
        (local.set $address
            (i32.shl
                (local.get $index)
                (i32.const 3)))
        ;; sanity check to prevent corruption
        (if
            (i32.ge_s
                (local.get $address)
                (global.get $SCRATCHPAD_SIZE))
            (then
                (unreachable)))
        (f64.store
            (local.get $address)
            (local.get $number)))

    (func $readScratch (param $index i32) (result f64)
        (f64.load
            (i32.shl
                (local.get $index)
                (i32.const 3))))

    (global $SIZEOF_OBJECT i32
        (i32.const 9))
    ;; workspace layout:
    (global $CAR_OFFSET i32
        (i32.const 1))
    (global $CDR_OFFSET i32
        (i32.const 1))
    ;; | offset=0        | offset=1 | offset=5 |
    ;; | 7 6 5 4 3 2 1 0 | 4 bytes  | 4 bytes  |
    ;; | G P P T T T T T | car ptr  | cdr ptr  |
    ;; |                 | 8-bit f64           |
    ;; G: garbage collector mark bit
    (global $GC_MARK_BIT i32
        (i32.const 0x80))
    ;; P: pointer bit
    (global $GC_CAR_IS_PTR_BIT i32
        (i32.const 0x40))
    (global $GC_CDR_IS_PTR_BIT i32
        (i32.const 0x20))
    (global $GC_BOTH_ARE_PTR_BITS i32
        (i32.const 0x60))
    ;; T: type tag
    (global $TYPE_TAG_MASK i32
        (i32.const 0x1F))
    ;;    Cons - (car Any . cdr Any)
    (global $TT_CONS i32
        (i32.const 0))
    ;;    Number
    (global $TT_NUMBER i32
        (i32.const 1))
    ;;    Vec2 - (x Number . y Number)
    (global $TT_VEC2 i32
        (i32.const 2))
    ;;    Rect - (topleft Vec2 . dimensions Vec2)
    (global $TT_RECT (export "TT_RECT") i32
        (i32.const 3))
    ;;    Line - (p1 Vec2 . p2 Vec2)
    (global $TT_LINE (export "TT_LINE") i32
        (i32.const 4))
    ;;    Point - (x Number . y Number)
    (global $TT_POINT (export "TT_POINT") i32
        (i32.const 5))
    ;;    Circle - (radius Number . center Vec2)
    (global $TT_CIRCLE (export "TT_CIRCLE") i32
        (i32.const 6))
    ;;    Ellipse - (angle Number . (dimensions Vec2 . center Vec2))
    (global $TT_ELLIPSE (export "TT_ELLIPSE") i32
        (i32.const 7))
    ;;    Polygon - (p1 Vec2 . (p2 Vec2 . (p3 Vec2 . etc))) until null
    (global $TT_POLYGON (export "TT_POLYGON") i32
        (i32.const 8))
    ;;    GameObj - (id i32 . collider Shape)
    (global $TT_GAMEOBJ i32
        (i32.const 9))
    ;;    SAP

    (global $Freelist (mut i32)
        (i32.const 0))
    (global $Freespace (export "freeSpace") (mut i32)
        (i32.const 0))
    (global $WorkspaceSize (export "workspaceSize") (mut i32)
        (i32.const 0))
    (global $SAPEdgeList (mut i32)
        (i32.const 0))
    (global $SAPObjectMap (mut i32)
        (i32.const 0))
    ;; object list is a linked list of all the colliders

    ;; MARK: object->field

    ;; helper: get requested header bits
    (func $objGetHeaderBits (param $ptr i32) (param $bits i32) (result i32)
        (i32.and
            (local.get $bits)
            (i32.load8_u
                (local.get $ptr))))
    ;; helper: set or clear specific header bits
    (func $objWriteHeaderBits
        (param $ptr i32) (param $bitsToClear i32) (param $bitsToSet i32)
        (i32.store8
            (local.get $ptr)
            (i32.or
                (local.get $bitsToSet)
                (i32.and
                    (i32.load8_u
                        (local.get $ptr))
                    (i32.xor
                        (local.get $bitsToClear)
                        (i32.const 0xFF))))))

    ;; test if the mark bit is set
    (func $objIsMarked (param $ptr i32) (result i32)
        (call $objGetHeaderBits
            (local.get $ptr)
            (global.get $GC_MARK_BIT)))
    ;; set/clear mark bit on object
    (func $objMarkObj (param $ptr i32)
        (call $objWriteHeaderBits
            (local.get $ptr)
            (i32.const 0)
            (global.get $GC_MARK_BIT)))
    (func $objUnMarkObj (param $ptr i32)
        (call $objWriteHeaderBits
            (local.get $ptr)
            (global.get $GC_MARK_BIT)
            (i32.const 0)))

    ;; gets the type field (low 5 bits) of object header field
    (func $objGetType (param $ptr i32) (result i32)
        (call $objGetHeaderBits
            (local.get $ptr)
            (global.get $TYPE_TAG_MASK)))
    ;; sets the type field (low 5 bits)
    (func $objSetType (param $ptr i32) (param $type i32)
        (call $objWriteHeaderBits
            (local.get $ptr)
            (global.get $TYPE_TAG_MASK)
            (local.get $type)))

    ;; test if the pointer bit 1 (P1, bit 6) is set
    (func $objIsCarPtr (param $ptr i32) (result i32)
        (call $objGetHeaderBits
            (local.get $ptr)
            (global.get $GC_CAR_IS_PTR_BIT)))
    ;; test if the pointer bit 2 (P2, bit 5) is set
    (func $objIsCdrPtr (param $ptr i32) (result i32)
        (call $objGetHeaderBits
            (local.get $ptr)
            (global.get $GC_CDR_IS_PTR_BIT)))

    ;; get id field of object (car ptr, 4 bytes at offset 1)
    (func $objGetCar (param $ptr i32) (result i32)
        (i32.load
            (i32.add
                (local.get $ptr)
                (global.get $CAR_OFFSET))))
    ;; set id field of obj
    (func $objSetCar (param $ptr i32) (param $id i32)
        (i32.store
            (i32.add
                (local.get $ptr)
                (global.get $CAR_OFFSET))
            (local.get $id)))

    ;; get next field (cdr ptr, 4 bytes at offset 5)
    (func $objGetCdr (param $ptr i32) (result i32)
        (i32.load
            (i32.add
                (local.get $ptr)
                (global.get $CDR_OFFSET))))
    ;; set next field (cdr ptr, 4 bytes at offset 5)
    (func $objSetCdr (param $ptr i32) (param $next i32)
        (i32.store
            (i32.add
                (local.get $ptr)
                (global.get $CDR_OFFSET))
            (local.get $next)))

    ;; get number from object field
    (func $objGetNumber (param $ptr i32) (result f64)
        (f64.load
            (i32.add
                (local.get $ptr)
                (global.get $CAR_OFFSET))))
    ;; set number field
    (func $objSetNumber (param $ptr i32) (param $num f64)
        (f64.store
            (i32.add
                (local.get $ptr)
                (global.get $CAR_OFFSET))
            (local.get $num)))

    ;; MARK: garbage collector
    (func $gcMarkObject (param $ptr i32)
        ;; don't try to mark NULL
        (if
            (i32.eq
                (i32.const 0)
                (local.get $ptr))
            (then
                (return)))
        ;; don't recurse if already marked
        (if
            (call $objIsMarked
                (local.get $ptr))
            (then
                (return)))
        ;; do the mark
        (call $objMarkObj
            (local.get $ptr))
        ;; if car is a pointer, recurse
        (if
            (call $objIsCarPtr
                (local.get $ptr))
            (then
                (call $gcMarkObject
                    (call $objGetCar
                        (local.get $ptr)))))
        ;; recurse (tail call) if cdr is pointer, else stop looping
        (if
            (call $objIsCdrPtr
                (local.get $ptr))
            (then
                (return_call $gcMarkObject
                    (call $objGetCdr
                        (local.get $ptr))))))

    (func $memSizeInBytes (result i32)
        (i32.mul
            (global.get $DEFAULT_PAGE_SIZE)
            (memory.size)))
    (func $bytesAvailableForObjects (result i32)
        (i32.sub
            (call $memSizeInBytes)
            (i32.const 64)))
    (func $maxObjects (result i32)
        (i32.div_u ;; flooring division
            (call $bytesAvailableForObjects)
            (global.get $SIZEOF_OBJECT)))
    ;; allow JS to tell us when to garbage collect
    (func $gc (export "gc")
        (local $tmpFreelist i32) (local $tmpFreespace i32) (local $curObj i32) (local $maxObjects i32) (local $objectNo i32)
        ;; mark all globals
        (call $gcMarkObject
            (global.get $SAPEdgeList))
        (call $gcMarkObject
            (global.get $SAPObjectMap))
        ;; if the load factor is over 75% then allocate a new page
        (if
            (i32.lt_s
                (i32.shl
                    (global.get $Freespace)
                    (i32.const 2))
                (call $maxObjects))
            (then
                (memory.grow
                    (i32.const 1))
                ;; sanity check: if we're out of memory (memory.grow returned -1)
                ;; throw a fault
                (if
                    (i32.gt_s ;; this is 0 > memory.grow()
                        (i32.const 0))
                    (then
                        (unreachable)))
                (local.set $maxObjects
                    (call $maxObjects))))

        (global.set $Freespace
            (local.get $maxObjects))
        ;; get the address of the first object in memory
        (local.set $curObj
            (global.get $SCRATCHPAD_SIZE))
        (global.set $Freespace
            (i32.const 0))
        (local.set $tmpFreelist
            (i32.const 0))
        (local.set $tmpFreespace
            (i32.const 0))
        (local.set $objectNo
            (i32.const 0))
        (loop $sweeploop
            (if
                (call $objIsMarked
                    (local.get $curObj))
                (then
                    ;; un-mark the object
                    (call $objUnMarkObj
                        (local.get $curObj)))
                (else
                    ;; increment freespace and set to Freelist
                    (memory.fill
                        (local.get $curObj)
                        (i32.const 0)
                        (global.get $SIZEOF_OBJECT))
                    (call $objSetCdr
                        (local.get $curObj)
                        (local.get $tmpFreelist))
                    (local.set $tmpFreespace
                        (i32.add
                            (i32.const 1)
                            (local.get $tmpFreespace)))))
            ;; go to next object
            (local.set $curObj
                (i32.add
                    (local.get $curObj)
                    (global.get $SIZEOF_OBJECT)))
            (local.set $objectNo
                (i32.add
                    (i32.const 1)
                    (local.get $objectNo)))
            ;; loop if there are more
            (br_if $sweeploop
                (i32.lt_s
                    (local.get $objectNo)
                    (local.get $maxObjects))))
        (global.set $Freespace
            (local.get $tmpFreespace))
        (global.set $Freelist
            (local.get $tmpFreelist)))

    (start $gc) ;; start by initializing the freelist

    ;; MARK: object makers

    ;; basic func get obj from Freelist
    (func $popFreelist (result i32) (local $head i32)
        (local.set $head
            (global.get $Freelist))
        (global.set $Freelist
            (call $objGetCdr
                (local.get $head)))
        (global.set $Freespace
            (i32.sub
                (global.get $Freespace)
                (i32.const 1)))
        (memory.fill
            (local.get $head)
            (i32.const 0)
            (global.get $SIZEOF_OBJECT)) ;; memset(ptr, 0, sizeof(*ptr))
        (local.get $head))

    ;; cons cell basic
    (func $consWithType
        (param $car i32) (param $cdr i32) (param $type i32) (result i32)
        (local $cell i32)
        (local.set $cell
            (call $popFreelist))
        (call $objSetCar
            (local.get $cell)
            (local.get $car))
        (call $objSetCdr
            (local.get $cell)
            (local.get $cdr))
        ;; set pointer bits & type
        (call $objWriteHeaderBits
            (local.get $cell)
            (i32.const 0)
            (i32.or
                (global.get $GC_BOTH_ARE_PTR_BITS)
                (local.get $type)))
        (local.get $cell))

    (func $makeNumber (param $num f64) (result i32) (local $cell i32)
        (local.set $cell
            (call $popFreelist))
        (call $objSetNumber
            (local.get $cell)
            (local.get $num))
        (call $objSetType
            (local.get $cell)
            (global.get $TT_NUMBER))
        (local.get $cell))

    (func $makeVec2 (param $x f64) (param $y f64) (result i32)
        (call $consWithType
            (call $makeNumber
                (local.get $x))
            (call $makeNumber
                (local.get $y))
            (global.get $TT_VEC2)))

    (func $unboxVec2 (param $vecObj i32) (result f64 f64)
        (call $objGetNumber
            (call $objGetCar
                (local.get $vecObj)))
        (call $objGetNumber
            (call $objGetCdr
                (local.get $vecObj))))

)
