/**
* This javascript will be injected in the current page after clicking the button
*/

var title=null,description=null;

/**
* Gets title and description from metadata
*/
function retrieveMetaTags() {
	var i = 0;
	var meta = null;
	var metatags = document.getElementsByTagName("meta");
	while(i < metatags.length && (title == null || description == null)){
		meta = metatags[i];
		if(meta.name == "Title" || meta.name == "title" || meta.name == "TITLE"){
			title = meta.content;
		}
		if(meta.name == "Description" || meta.name == "DESCRIPTION" || meta.name == "description"){
			description = meta.content;
		}
		i++;
	};
}

retrieveMetaTags();
chrome.extension.sendRequest({title: title, description: description});

