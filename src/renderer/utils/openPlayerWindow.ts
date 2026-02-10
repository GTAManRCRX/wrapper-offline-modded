export default function openPlayerWindow(movieId: string) {
    const isWideRaw = localStorage.getItem("isWide_active");
    const isWide = isWideRaw === null ? true : (isWideRaw === "true" || isWideRaw === "1");

    let width = Math.round(screen.availWidth * 0.6665);
    
    const videoHeight = isWide 
        ? Math.round(width / (16 / 9)) 
        : Math.round(width / (14 / 9));

    let height = videoHeight + 26;

    const isWindows = (typeof process !== 'undefined' && process.platform === 'win32') || 
                      (navigator.platform.indexOf('Win') !== -1);

    if (isWindows) {
        width += 4;

        if (isWide) {
            height += 42; 
        } else {
            height += 42; 
        }
    }

    const left = Math.round((screen.availWidth - width) / 2);
    const top = Math.round((screen.availHeight - height) / 2);

    window.open(
        `?redirect=/movies/play/${movieId}`,
        "Video player - Wrapper offline",
        `width=${width},height=${height},left=${left},top=${top},menubar=no,status=no,resizable=no`
    );
}