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
        || id.includes("pro controller")
        || vendor === 0x057e) // Nintendo
        return "switch";
    return undefined;
}

function extractVendorProductId(id: string): { vendor: number | undefined, product: number | undefined } {
    const vendorMatch = id.match(/vendor:\s*([0-9a-f]{4})/);
    const productMatch = id.match(/product:\s*([0-9a-f]{4})/);

    const vendor = vendorMatch ? parseInt("" + vendorMatch[1], 16) : undefined;
    const product = productMatch ? parseInt("" + productMatch[1], 16) : undefined;

    return { vendor, product };
}
