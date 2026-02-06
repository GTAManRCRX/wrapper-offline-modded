export default function openPlayerWindow(movieId: string) {
    const isWideRaw = localStorage.getItem("isWide_active");
    const isWide = isWideRaw === null ? true : (isWideRaw === "true" || isWideRaw === "1");

    const baseWidth = 1280;
    const innerHeight = isWide ? 720 : 823;

    const framePadding = 26; 
    const width = baseWidth;
    const height = innerHeight + framePadding;

    const left = Math.round((screen.width - width) / 2);
    const top = Math.round((screen.height - height) / 2);

    console.log(`The current resolution: ${baseWidth}x${innerHeight} - Aspect ratio: ${isWide ? '16:9' : '14:9'}`);

    window.open(
        `?redirect=/movies/play/${movieId}`,
        "Video player - Wrapper offline",
        `width=${width},height=${height},left=${left},top=${top},menubar=no,status=no,resizable=no`
    );
}