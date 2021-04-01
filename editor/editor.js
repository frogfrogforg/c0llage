function main() {
    // Background image selection
    const backgroundImageInput = document.getElementById("background-image-input");
    backgroundImageInput.addEventListener("change", setBackgroundImage, false);

    const htmlInput = document.getElementById("html-input");
    htmlInput.addEventListener("change", importHtml, false);
}

function setBackgroundImage() {
    const backgroundElement = document.getElementById("background");
    const file = this.files[0];
    window.backgroundImageFilename = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
        backgroundElement.src = e.target.result;
    }
    reader.readAsDataURL(file);
}

function importHtml() {
    const backgroundElement = document.getElementById("background");
    const file = this.files[0];
    window.htmlFilename = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(e.target.result, 'text/html');
        loadFromHtml(htmlDoc);
    }
    reader.readAsText(file);
}

function loadFromHtml(htmlDoc) {
    // Clear all current hotspot frames
    Array.from(document.getElementsByClassName("Frame")).forEach((el) => {
        el.parentNode.removeChild(el);
    })

    console.log(htmlDoc);
    const hotspots = htmlDoc.getElementsByClassName("hotspot")

    // Assume each hotspot in the html has width, height, left, & top all specified in %
    // convert to px values based on the current size of the bounding box

    const framesElement = document.getElementById("frames");
    const boundsWidth = framesElement.clientWidth;
    const boundsHeight = framesElement.clientHeight;

    Array.from(hotspots).forEach((hotspotEl) => {
        const left =   parseFloat(hotspotEl.style.left);
        const top =    parseFloat(hotspotEl.style.top);
        const width =  parseFloat(hotspotEl.style.width);
        const height = parseFloat(hotspotEl.style.height);

        console.log(hotspotEl);
        console.log(left,top,width,height);
        addHotspot({
            x: left,
            y: top,
            width: width,
            height: height,
            temperament: "phlegmatic"
        }, hotspotEl.getAttribute("href"));
    })
}

function addHotspot(attributes, href) {
    const framesElement = document.getElementById("frames");
    const textboxHtml = `<input type='text' size='10' value="${href || "./XXX.html"}"/>`;
    const hotspotFrameElement = document.createElement("draggable-frame");
    framesElement.appendChild(hotspotFrameElement);
    // not sure what is a better way to do this:
    // hotspotFrameElement.outerHTML = "<draggable-frame temperament='phlegmatic' width=30 height=30></draggable-frame>"
}

// takes the current state and export an html file
function exportHtml() {
    const backgroundImageFilename = window.backgroundImageFilename;

    const frames = Array.from(document.getElementsByClassName("Frame")).filter((el) => el.hidden);

    const framesElement = document.getElementById("frames");
    const boundsWidth = framesElement.clientWidth;
    const boundsHeight = framesElement.clientHeight;

    const hotspotsHtml = frames.map((el) =>
        {
            // compute dimensions as percentages of the bounding box
            const style = window.getComputedStyle(el);
            const prec = 3;
            const left =    (100*parseFloat(style.getPropertyValue('left'))  /boundsWidth ).toFixed(prec);
            const top =     (100*parseFloat(style.getPropertyValue('top'))   /boundsHeight).toFixed(prec);
            const width =   (100*parseFloat(style.getPropertyValue('width')) /boundsWidth ).toFixed(prec);
            const height =  (100*parseFloat(style.getPropertyValue('height'))/boundsHeight).toFixed(prec);

            const href = el.querySelector("input").value;


            return `<a class="hotspot" href="${href || "./REPLACE-THIS.html"}" style="left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%"></a>`
        }
    ).join("\n            ");

    const html = 
`<head>
    <link rel="stylesheet" href="common.css">
    <script src="common.js"></script>
</head>

<body>
    <div class="container">
        <main class="content">
            <img class="background" src="./images/${backgroundImageFilename}"></img>
            ${hotspotsHtml}
        </main>
    </div>
</body>
`
    const outputFilename = window.htmlFilename || '123.html';
    saveHtmlFile(outputFilename, html);
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
