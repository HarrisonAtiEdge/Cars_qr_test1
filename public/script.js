// script.js file

function domReady(fn) {
    if (
        document.readyState === "complete" ||
        document.readyState === "interactive"
    ) {
        setTimeout(fn, 1000);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

domReady(function () {

    // If found you qr code
    function onScanSuccess(decodeText, decodeResult) {
        console.log("You Qr is : " + decodeText, decodeResult);

       // Stop the scanner
        htmlscanner.clear().then(() => {
            // Redirect to the scanned URL after stopping the scanner
            window.location.href = decodeText;
        }).catch(error => {
            console.error("Failed to stop the scanner:", error);
        });
    }

    let htmlscanner = new Html5QrcodeScanner(
        "my-qr-reader",
        { fps: 10, qrbos: 250 }
    );
    htmlscanner.render(onScanSuccess);
});