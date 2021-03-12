function main() {
    // Background image selection
    const inputElement = document.getElementById("background-image-input");
    const backgroundElement = document.getElementById("background");
    inputElement.addEventListener("change", setBackgroundImage, false);
    function setBackgroundImage() {
        const file = this.files[0];
        window.backgroundImageFilename = file.name;

        const reader = new FileReader();
        reader.onload = (
            function(aImg) {
                return function(e) {
                    aImg.src = e.target.result;
                };
            }
        )(backgroundElement);
        reader.readAsDataURL(file);
    }
}

function addHotspot() {
    const framesElement = document.getElementById("frames");
    const hotspotFrameElement = Frames.create("content", {});

    framesElement.appendChild(hotspotFrameElement);
}

// takes the current state and export an html file
function exportHtml() {
    const backgroundImageFilename = window.backgroundImageFilename;
    const html = 
`<head>
    <link rel="stylesheet" href="common.css">
    <script src="common.js"></script>
</head>

<body>
    <div class="container">
        <main class="content">
            <img class="background" src="./images/${backgroundImageFilename}"></img>
        </main>
    </div>
</body>
`
    saveHtmlFile('123.html', html);
}

function saveHtmlFile(filename, html) {
    // https://stackoverflow.com/a/20194533
    var a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([html], {type: 'text/html'}));
    a.download = filename;

    // Append anchor to body.
    document.body.appendChild(a);
    a.click();

    // Remove anchor from body
    document.body.removeChild(a);
}