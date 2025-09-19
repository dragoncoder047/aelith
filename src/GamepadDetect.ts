enum HIDAssignedNumber {
    VID_SONY = 0x054c,
    VID_MICROSOFT = 0x045e,
    VID_NINTENDO = 0x057e,
    PID_DUALSHOCK_4 = 0x09cc,
    PID_DUALSENSE = 0x0ce6,
    PID_DUALSENSE_EDGE = 0x0df2,
}


export function detectGamepadTypeFromID(id: string) {
    id = id.toLowerCase();

    const { vendor, product } = extractVendorProductId(id);

    if (id.includes("ps4")
        || id.includes("dualshock")
        || (vendor === HIDAssignedNumber.VID_SONY
            && product === HIDAssignedNumber.PID_DUALSHOCK_4))
        return "ps4";

    if (id.includes("ps5")
        || id.includes("dualsense")
        || (vendor === HIDAssignedNumber.VID_SONY
            && (product === HIDAssignedNumber.PID_DUALSENSE
                || product === HIDAssignedNumber.PID_DUALSENSE_EDGE)))
        return "ps5";

    if (id.includes("xbox") || vendor === HIDAssignedNumber.VID_MICROSOFT)
        return "xbox";

    if (id.includes("switch")
        || id.includes("joy-con")
        || vendor === HIDAssignedNumber.VID_NINTENDO)
        return "switch";

    return undefined;
}

export function isSingleJoyCon(id: string) {
    id = id.toLowerCase();
    if (detectGamepadTypeFromID(id) !== "switch") return undefined;
    if (id.includes("joy-con") && !id.includes("l+r")) return true;
    const { product } = extractVendorProductId(id);
    return product === 0x2006 || product === 0x2007;
}

function extractVendorProductId(id: string): { vendor: number | null, product: number | null } {
    const vendorMatch = /vendor[^\da-f]*([\da-f]{4})/i.exec(id);
    const productMatch = /product[^\da-f]*([\da-f]{4})/i.exec(id);

    const vendor = vendorMatch && parseInt(vendorMatch[1]!, 16);
    const product = productMatch && parseInt(productMatch[1]!, 16);

    return { vendor, product };
}
