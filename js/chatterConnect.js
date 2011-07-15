//Constants
var metaLength = 200;
var groupDescLength = 30;
var groupsText = 'My Profile/Groups';

// Metadata
var metaTitle 	= null; 
var metaDesc 	= null;
var metaUrl		= null;
var metaImg		= null;

// Error messages 
var emptyPostMessage = 'Error: Feed Post can not be empty';
var emptyGroupMessage = 'Error: You must select a group';

//************************
// Init methods
//************************
$(document).ready(function(){
	showLoader();
	getMetadataContent();
});

/**
* Retrieves metadata title and description from current page
*/
function getMetadataContent(){
	createRequestListener();

	//Injects content_script.js in current page.
	chrome.tabs.executeScript(null, {file: "./js/content_script.js"});
}

/**
* Adds request listener to get metadata content
*/
function createRequestListener(){
	chrome.extension.onRequest.addListener(
		function(request, sender, sendResponse) {
			if (request.title != null){
				metaTitle = request.title.trim();
			}
			if(request.description != null){
				metaDesc = request.description.trim();
			}			
			init();
			hideLoader();
		}
	);
}

function init(){
	initMetadata();
	
	$("#postTextArea").focus();

	$("#username").text(chrome.extension.getBackgroundPage().user.username);
	
	initGroups();
	
	$("#notYou").click(function(){
		logout();
	});
	
	$("#postTextArea").blur(function(){
		if($("textarea#postTextArea").val() != ''){
			removeError("postTextArea");
		}
	});
}

function initMetadata(){
	// reset data
	$("#metaImg").empty();
	$("#metaText").empty();

	// init url
	chrome.tabs.getSelected(null, function(tab){
		metaUrl = tab.url;
		//get selected text
		chrome.tabs.sendRequest(tab.id, {method: "getSelection"}, function (response) {
			$("#postTextArea").val(response.data);
    	});
	});
	
	// init image
	chrome.tabs.captureVisibleTab(null,null, function(dataUrl){		
		// create image
		$(document.createElement("img"))
			.attr({ id: 'tabImg', src: dataUrl })
			.appendTo("#metaImg");
	});
	
	// init meta text
	var content = '';
	var title = '';
	var desc = '';
	if(metaTitle != null) {
		title = metaTitle.length > metaLength ? metaTitle.substring(0, metaLength) + '...' : metaTitle;
		$("#metaText").append($(document.createElement("b")).text(title));
		$(document.createElement("br")).appendTo("#metaText");
		$(document.createElement("br")).appendTo("#metaText");
	}
	
	
	if(metaDesc != null){
		desc = title.length + metaDesc.length > metaLength ? metaDesc.substring(0, metaLength - title.length) + '...' : metaDesc;
		$("#metaText").append($(document.createElement("span")).text(desc));
	} 

}

function initGroups(){
	var userGroups = chrome.extension.getBackgroundPage().userGroups;	
	
	// autocomplete properties
	$( "#chatterGroups" ).autocomplete({
		minLength: 0,
		source: userGroups,
		focus: function( event, ui ) {
			$( "#chatterGroups" ).val( ui.item.label );
			return false;
		},
		select: function( event, ui ) {
			$( "#chatterGroups" ).val(ui.item.label);
			$( "#chatterGroup-id" ).val( ui.item.value );
			removeError("chatterGroups");
			return false;
		},
	})
	// menu item definition
	.data( "autocomplete" )._renderItem = function( ul, item ) {
		var desc = item.desc.length > groupDescLength ? item.desc.substring(0, groupDescLength - 3) + '...' : item.desc;	
		var li = $(document.createElement("li")).data("item.autocomplete", item);
		var link = $(document.createElement("a"));
		
		// define menu item
		$(document.createElement("img"))
			.attr({src: item.icon})
			.addClass("groupImg")
			.appendTo(link);
		$(document.createElement("b")).text(item.label).appendTo(link);
		$(document.createElement("br")).appendTo(link);
		$(document.createElement("span")).text(desc).appendTo(link);
		link.appendTo(li);
		li.appendTo(ul);
		
		// define default image
		$('img.groupImg').error(function(){ 
			$(this).attr('src', './img/groups32.png'); 
		});
		
		
		return li;
	};
	
	$("#chatterGroups").val(groupsText)
					   .css("color", "#999");
	
	$("#chatterGroups").focus(function(){
		$(this).css("color", "black")
		if($(this).val() == groupsText){
			$(this).val('');
		}	
		$(this).autocomplete("search", $(this).val());
	});
	
	$("#chatterGroups").blur(function(){
		if($(this).val() == null || $("#chatterGroup-id").val() == ''){
			$(this).val(groupsText);
			$(this).css("color", "#999");
		}
	});

	$('#chatterGroups').live('keydown', function(e) { 
		var keyCode = e.keyCode || e.which; 
		if (keyCode != 9) { 
			$("#chatterGroup-id").val('');
		} 
	});
}

function showLoader(){
	$("#chatter-box").hide();
	$("#metaContent").hide();
	$("#footer").hide();
	$("#loader").show();
}

function hideLoader(){
	$("#loader").hide();
	$("#chatter-box").show();
	$("#metaContent").show();
	$("#footer").show();
}

//************************
// Background methods
//************************
function linkPost(){
	removeErrors();	

	if(metaTitle == null && metaDesc == null && $("textarea#postTextArea").val() == ''){
		addError("postTextArea", emptyPostMessage);
	}
	else if($("#chatterGroup-id").val() == ''){
		addError("chatterGroups", emptyGroupMessage);
	}
	else{
		var body 	= $("textarea#postTextArea").val().trim() + ' \n \n ';
		var title 	= metaTitle != null ? metaTitle : '';
		var desc 	= metaDesc 	!= null ? metaDesc 	: '';
		var meta 	= (title != '' && desc != '') ? (title + ' - ' + desc) : (title + desc);

		meta = meta.length > metaLength ? meta.substring(0, metaLength) + '...' : meta;
		body += meta; 
		
		if(body.length >= 1000){
			body = body.substring(0,999);
		}
		
		chrome.extension.getBackgroundPage().selectedGroup = $("#chatterGroup-id").val();
		
		chrome.extension.getBackgroundPage().linkPost(title, body, metaUrl, 'Linkpost', $("#chatterGroup-id").val());
		showLoader();
	}
}

function logout(){	
	chrome.extension.getBackgroundPage().logout();
	window.close();
}

function addError(inputId, message){
	$(document.createElement("div"))
		.attr({id: inputId + "-error"})
		.addClass("error")
		.text(message)
		.appendTo($("#" + inputId).parent());
	
	$("#" + inputId).addClass("errorContainer");
}

function removeErrors(){
	$(".error").remove();
	$(".errorContainer").removeClass("errorContainer");
}

function removeError(elementId){
	$( "#" + elementId ).removeClass("errorContainer");
	$( "#" + elementId + "-error").remove();
}