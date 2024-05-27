import { chatMarkDown } from "./md";
import { chatState } from "./state";

const URL_HISTORY = new Map<string, boolean>();

export async function loadChatImages(data: string[], index: number): Promise<void> {
    // Check for images - If a URL matches an image, convert it to a markdown image
    // This is done non-blocking to keep the chat experience smooth
    for (const [i, el] of data.entries()) {
        if (el.startsWith("http")) {
            const history = URL_HISTORY.get(el);
            let wrapImage = history === true;
            if (history === undefined) {
                console.log("cache miss");
                const isImage = await isImageUrl(el);
                URL_HISTORY.set(el, isImage);
                wrapImage = isImage;
            }
            if (wrapImage) {
                data[i] = `![](${el})`;
                chatState.mutableReactive.messages[index]!.content = chatMarkDown.render(data.join(""));
            }
        }
    }
}

async function isImageUrl(url: string): Promise<boolean> {
    const data = await fetch(url, { method: "HEAD" });
    return data.headers.get("content-type")?.startsWith("image/") ?? false;
}
