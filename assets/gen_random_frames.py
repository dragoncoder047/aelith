#! /usr/bin/env python3

from random import randrange

print("Player blinking [0 - 1]:")
pb = []
for _ in range(100):
    pb.append(1 if randrange(0, 7) == 0 else 0)
for i in range(1, len(pb)):
    if pb[i-1] == pb[i] == 1:
        pb[i] = 0
print(pb)
print()

print("Cont trap random blinkenlights [0 - 7]")
last = 0
bl = []
for _ in range(500):
    if randrange(5) == 0:
        last = randrange(8)
    bl.append(last)
print(bl)
print(all(x in bl for x in range(8)))
