export function detectGamepadType(id: string) {
    id = id.toLowerCase();

    const { vendor, product } = extractVendorProductId(id);

    if (id.includes("ps4")
        || id.includes("dualshock")
        || (vendor === 0x054c && product === 0x09cc)) // Sony, DS4
        return "ps4";

    if (id.includes("ps5")
        || id.includes("dualsense")
        || (vendor === 0x054c && product === 0x0ce6)) // Sony, DS5
        return "ps5";

    if (id.includes("xbox") || vendor === 0x045e) // Microsoft
        return "xbox";

    if (id.includes("switch")
        || id.includes("joy-con")
        || vendor === 0x057e) // Nintendo
        return "switch";

    return undefined;
}

export function isSingleJoyCon(id: string) {
    id = id.toLowerCase();
    if (detectGamepadType(id) !== "switch") return undefined;
    if (id.includes("joy-con") && !id.includes("l+r")) return true;
    const { product } = extractVendorProductId(id);
    return product === 0x2006 || product === 0x2007;
}

function extractVendorProductId(id: string): { vendor: number | null, product: number | null } {
    const vendorMatch = /vendor[^\da-f]*([\da-f]{4})/i.exec(id);
    const productMatch = /product[^\da-f]*([\da-f]{4})/i.exec(id);

    const vendor = vendorMatch && parseInt("" + vendorMatch[1], 16);
    const product = productMatch && parseInt("" + productMatch[1], 16);

    return { vendor, product };
}
