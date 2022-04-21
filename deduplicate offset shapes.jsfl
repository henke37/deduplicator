var doc=fl.getDocumentDOM();
var lib=doc.library;

fl.runScript(fl.scriptURI.replace("deduplicate%20offset%20shapes.jsfl","hash.jsfl"));
fl.runScript(fl.scriptURI.replace("deduplicate%20offset%20shapes.jsfl","bounds.jsfl"));

fl.outputPanel.clear();

var hashmap=new Object();
var replacements=[];
var swaps=0;

function hashSymbols() {
	var cnt=0;
	var uniqCnt=0;

	for each(var symb in lib.items) {
		
		if(symb.itemType!="graphic" && symb.itemType!="movie clip" && symb.itemType!="button") continue;
		
		//if(symb.name!="Symbol 7547") continue;
		
		var timeline=symb.timeline;
		
		if(timeline.frameCount>1) continue;
		if(timeline.layerCount>1) continue;
		
		cnt++;
		
		var layer=timeline.layers[0];
		var frame=layer.frames[0];
		
		var bounds=elementsBounds(frame.elements);
		
		var hash=hashSymbol(symb,bounds.minX,bounds.minY);
		
		var item={symb: symb, hash: hash, bounds: bounds };
		if(hash in hashmap) {
			hashmap[hash].push(item);
		} else {
			hashmap[hash]=[item];
			uniqCnt++;
		}
		
		fl.trace(symb.name+ " "+hash+" ("+bounds.minX.toFixed(2)+","+bounds.minY.toFixed(2)+","+bounds.maxX.toFixed(2)+","+bounds.maxY.toFixed(2)+")");
	}
	fl.trace(uniqCnt + " vs "+cnt);
}

hashSymbols();

findReplacements();

deduplicate();

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
					var replacement=replacements[elm.libraryItem.name];
					
					var xDiff=replacement.oldItem.bounds.minX-replacement.newItem.bounds.minX;
					var yDiff=replacement.oldItem.bounds.minY-replacement.newItem.bounds.minY;
					
					elm.x+=xDiff;
					elm.y+=yDiff;
					elm.libraryItem=replacement.newItem.symb;
					
					swaps++;
				}
			}
		}
	}
}

function findReplacements() {
	for(var hash in hashmap) {
		var items=hashmap[hash];
		
		items.sort(symbolComparator);
		
		for(var j=1;j<items.length;++j) {
			replacements[items[j].symb.name]={ newItem:items[0], oldItem: items[j]};
			fl.trace(items[j].symb.name+" -> "+items[0].symb.name);
		}
	}
}

function symbolComparator(x,y) {
	var badXName=x.symb.name.indexOf("Duplicate Items Folder")!=-1;
	var badYName=y.symb.name.indexOf("Duplicate Items Folder")!=-1;
	if(badXName && !badYName) return 1;
	if(!badXName && badYName) return -1;
	
	badXName=x.symb.name.indexOf("Tween")!=-1;
	badYName=y.symb.name.indexOf("Tween")!=-1;
	if(badXName && !badYName) return 1;
	if(!badXName && badYName) return -1;
	
	badXName=x.symb.name.indexOf("Symbol")!=-1;
	badYName=y.symb.name.indexOf("Symbol")!=-1;
	if(badXName && !badYName) return 1;
	if(!badXName && badYName) return -1;
	
	badXName=x.symb.name.indexOf("copy")!=-1;
	badYName=y.symb.name.indexOf("copy")!=-1;
	if(badXName && !badYName) return 1;
	if(!badXName && badYName) return -1;
	
	var xSlashes=x.symb.name.match(/\//g);
	xSlashes=xSlashes?xSlashes.length:0;
	var ySlashes=y.symb.name.match(/\//g);
	ySlashes=ySlashes?ySlashes.length:0;
	if(xSlashes>ySlashes) return -1;
	if(xSlashes<ySlashes) return 1;
	
	return 0;
}