var lib=document.library;
var cnt=0;
var uniqCnt=0;
var swaps=0;

var hashmap=new Object();
var replacements={};

fl.runScript(fl.scriptURI.replace("deduplicate.jsfl","hash.jsfl"));

try {

for each(var item in lib.items) {
	if(item.itemType!="movie clip" && item.itemType!="graphic") continue;
	var tl=item.timeline;
	//if(tl.layerCount>1) continue;
	//if(tl.frameCount>1) continue;
	cnt++;
	
	var hash=hashSymbol(item,0,0);
	fl.trace(item.name +":"+hash);
	
	if(hash in hashmap) {
		hashmap[hash].push(item);
	} else {
		hashmap[hash]=[item];
		uniqCnt++;
	}
}

fl.trace(uniqCnt + " vs "+cnt);

findReplacements();
deduplicate();

}catch(err) {
	fl.trace(err.stack);
	throw err;
}

function findReplacements() {
	for(var hash in hashmap) {
		var items=hashmap[hash];
		
		items.sort(symbolComparator);
		
		for(var j=1;j<items.length;++j) {
			replacements[items[j].name]=items[0];
			fl.trace(items[j].name+" -> "+items[0].name);
		}
	}
}

function deduplicate() {
	
	for each(var timeline in document.timelines) {
		swapItemsInTimeline(timeline);
	}
	
	for each(var item in document.library.items) {
		if(item.itemType!="movie clip" && item.itemType!="graphic" && item.itemType!="button") continue;
		swapItemsInTimeline(item.timeline);
	}

	fl.trace("Did "+swaps+" swaps");

	var dels=0;

	//Careful, item is the from symbol name (delete) and replacements[item] is the to symbol name (keep)
	for (var item in replacements) {
		var s=lib.deleteItem(item);
		if(s) dels++;
	}

	fl.trace("Deleted "+dels+" duplicate symbols");

}

function swapItemsInTimeline(timeline) {
	for each(var layer in timeline.layers) {
		var frames=layer.frames;
		var n=frames.length;
		
		for(var i=0;i<n;++i) {
			var frame=frames[i];
			if(i!=frame.startFrame) continue;
			
			for(var elmnIndex=0;elmnIndex<frame.elements.length;++elmnIndex) {
				var elm=frame.elements[elmnIndex];
				
				if(elm.elementType!="instance") continue;
				
				if(elm.libraryItem.name in replacements) {
					elm.libraryItem=replacements[elm.libraryItem.name];
					swaps++;
				}
			}
		}
	}
}

function symbolComparator(x,y) {
	var badXName=x.name.indexOf("Duplicate Items Folder")!=-1;
	var badYName=y.name.indexOf("Duplicate Items Folder")!=-1;
	if(badXName && !badYName) return 1;
	if(!badXName && badYName) return -1;
	
	badXName=x.name.indexOf("Tween")!=-1;
	badYName=y.name.indexOf("Tween")!=-1;
	if(badXName && !badYName) return 1;
	if(!badXName && badYName) return -1;
	
	badXName=x.name.indexOf("Symbol")!=-1;
	badYName=y.name.indexOf("Symbol")!=-1;
	if(badXName && !badYName) return 1;
	if(!badXName && badYName) return -1;
	
	badXName=x.name.indexOf("copy")!=-1;
	badYName=y.name.indexOf("copy")!=-1;
	if(badXName && !badYName) return 1;
	if(!badXName && badYName) return -1;
	
	var xSlashes=x.name.match(/\//g);
	xSlashes=xSlashes?xSlashes.length:0;
	var ySlashes=y.name.match(/\//g);
	ySlashes=ySlashes?ySlashes.length:0;
	if(xSlashes>ySlashes) return -1;
	if(xSlashes<ySlashes) return 1;
	
	return 0;
}