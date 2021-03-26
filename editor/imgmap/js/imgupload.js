// --- HTML Code to select the files from by user ---
// <input type="file" id="files" name="files[]" multiple />
// <output id="list"></output>

// --- Check FileReaderAPI ---
// Check for the various File API support.

function el(pID) {
	return document.getElementById(pID)
}

function fillPanoramaParams() {
	el("panowidth").value = myimgmap.pic.width;
	el("panoheight").value = myimgmap.pic.height;
	if (myimgmap.panoURL == "") {
		alert("Panorama URL contains not an Image that is online available. Use default image!")
		el("panoimgurl").value = myimgmap.panoURLdefault;
	} else {
		el("panoimgurl").value = myimgmap.panoURL;
	}
	el("panoimgmap").value = el("html_container").value;
	el("form2panorama").submit();
}

function setLoadImageURL(pFilename) {
	var vURL = "https://en.wikipedia.org/wiki/Special:Redirect/file/"+pFilename;
	console.log("setLoadImageURL('"+vURL+"') for WikiMedia");
	el("source_url2").value = vURL;
	myimgmap.mapname = pFilename;
	myimgmap.mapid = pFilename.replace(/[^A-Za-z0-9]/g,"");
	myimgmap.panoURL = vURL;
}

if (window.File && window.FileReader && window.FileList && window.Blob) {
  console.log("FileReader API is supported");
} else {
  alert('The File APIs are not fully supported in this browser.');
}


function handleFileSelectInfo(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
      output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                  f.size, ' bytes, last modified: ',
                  f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                  '</li>');
    }
    el('list').innerHTML = '<ul>' + output.join('') + '</ul>';
		//myimgmap.mapname = escape(f.name);
}

//--- add event listener 'handleFileSelectInfo()' to file selector ---
el('file-chooser').addEventListener('change', handleFileSelect, false);

 function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

      // Only process image files.
      if (!f.type.match('image.*')) {
        continue;
      }

      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
          // append thumbnail to thumb container
					var vThumbContainer = el('list');
					vThumbContainer.innerHTML = "";
					var span = document.createElement('span');
          span.innerHTML = ['<img class="thumb" src="', e.target.result,
                            '" title="', escape(theFile.name), '"/>'].join('');
					vThumbContainer.insertBefore(span, null);
					// append uploaded image to image container
					var vIMG = document.createElement('img');
					var vPicContainer = el('pic_container');
					vPicContainer.innerHTML = "";
					vIMG.setAttribute("src",e.target.result);
					vIMG.setAttribute("title",escape(theFile.name));
					vPicContainer.append(vIMG);
					//gui_loadImage(e.target.result);
					// set ImageMap Editor Picture to
					myimgmap.pic = vIMG;
					myimgmap.mapname = escape(theFile.name);
					myimgmap.mapid = (escape(theFile.name)).replace(/[^A-Za-z0-9]/g,"");
					el("upload_filename").value = theFile.name;
					// set Panorama360 URL to "" because a local file cannot be accessed in the Panorama 360 Image Starter
					myimgmap.panoURL = "";
					el("upload_filename").style.display = "block";
					myimgmap.assignEvents2Image();
					gui_display_edit_interface();
			  };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);
    }
  }

//--- add event listener 'handleFileSelectInfo()' to file selector ---
//el('file-chooser').addEventListener('change', handleFileSelect, false);

function reset_ImageMap_Container() {
	el('dd_zoom').value = '1';
	var pic = el('pic_container').getElementsByTagName('img')[0];
	if (typeof pic != 'undefined') {
		//delete already existing pic
		pic.parentNode.removeChild(pic);
		delete myimgmap.pic;
	};
};
