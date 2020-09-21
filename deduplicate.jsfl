var lib=document.library;
var cnt=0;
var uniqCnt=0;

var hashmap=new Object();

try {

for each(var item in lib.items) {
	if(item.itemType!="movie clip" && item.itemType!="graphic") continue;
	var tl=item.timeline;
	//if(tl.layerCount>1) continue;
	//if(tl.frameCount>1) continue;
	cnt++;
	
	var hash=hashTimeline(tl);
	//fl.trace(item.name +":"+hash);
	
	if(hash in hashmap) {
		hashmap[hash].push(item);
	} else {
		hashmap[hash]=[item];
		uniqCnt++;
	}
}

fl.trace(uniqCnt + " vs "+cnt);

deduplicate(hashmap);

}catch(err) {
	fl.trace(err.stack);
	throw err;
}

function deduplicate(hashmap) {
	var replacements={};

	for(var hash in hashmap) {
		var items=hashmap[hash];
		
		items.sort(symbolComparator);
		
		for(var j=1;j<items.length;++j) {
			replacements[items[j].name]=items[0];
			fl.trace(items[j].name+" -> "+items[0].name);
		}
	}

	var swaps=0;

	for each(var item in document.library.items) {
		if(item.itemType!="movie clip" && item.itemType!="graphic") continue;
		var timeline=item.timeline;
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

	fl.trace("Did "+swaps+" swaps");

	var dels=0;

	//Careful, item is the from symbol name (delete) and replacements[item] is the to symbol name (keep)
	for (var item in replacements) {
		var s=lib.deleteItem(item);
		if(s) dels++;
	}

	fl.trace("Deleted "+dels+" duplicate symbols");

}

function symbolComparator(x,y) {
	var xSlashes=x.name.match(/\//g);
	xSlashes=xSlashes?xSlashes.length:0;
	var ySlashes=y.name.match(/\//g);
	ySlashes=ySlashes?ySlashes.length:0;
	if(xSlashes>ySlashes) return -1;
	if(xSlashes<ySlashes) return 1;
	
	var badXName=x.name.indexOf("Symbol")!=-1;
	var badYName=y.name.indexOf("Symbol")!=-1;
	if(badXName && !badYName) return 1;
	if(!badXName && badYName) return -1;
	
	return 0;
}

//fl.trace(hashTimeline(lib.items[41].timeline));

function hashTimeline(tl) {
	var hash=0;
	for each(var layer in tl.layers) {
		var hash2= h(hash,hashLayer(layer));
		//fl.trace(layer.name+" "+hash2);
		hash = hash2;
	}
	return hash;
}

function hashLayer(layer) {
	var hash=hashString(layer.layerType);
	var frames=layer.frames;
	var n=frames.length;
	for(var i=0;i<n;++i) {
		var frame=frames[i];
		if(i!=frame.startFrame) continue;
		var hash2=hashFrame(frame);
		hash = h(hash,hash2);
	}
	return hash+1;
}

function hashFrame(frame) {
	var hash=h(frame.duration,frame.startFrame);
	for each(var elm in frame.elements) {
		var hash2=hashElement(elm);
		hash = h(hash,hash2);
	}
	return hash+1;
}

function hashElement(elm) {
	var hash = hashMatrix(elm.matrix);
	if(elm.name!="") {
		hash=h(hash, hashString(elm.name));
	}
		
	switch(elm.elementType) {
		case "shape":
			hash =h(hash, hashShape(elm));
		break;
		case "instance": 
			hash =h(hash, hashString(elm.libraryItem.name));
			switch(elm.instanceType) {
				case "symbol":
					hash =h(hash,hashSymbolInstance(elm));
				break;
			}
		break;
		case "text":
			hash =h(hash, hashText(elm));
		break;
	}
	
	return hash;
}

function hashText(txt) {
	var hash=hashString(txt.textType);
	
	for each(var run in txt.textRuns) {
		hash=h(hash, hashString(run.characters));
	}
	
	return hash;
}

function hashSymbolInstance(inst) {
	var hash=hashString(inst.bitmapRenderMode);
	switch(inst.colorMode) {
		case "advanced":
			hash=h(hash, inst.colorAlphaAmount);
			hash=h(hash, inst.colorAlphaPercent);
			hash=h(hash, inst.colorRedAmount);
			hash=h(hash, inst.colorRedPercent);
			hash=h(hash, inst.colorGreenAmount);
			hash=h(hash, inst.colorGreenPercent);
			hash=h(hash, inst.colorBlueAmount);
			hash=h(hash, inst.colorBluePercent);
		break;
		
		case "alpha":
			hash=h(hash, inst.colorAlphaAmount);
			hash=h(hash, inst.colorAlphaPercent);
		break;
		
		case "tint":
			hash=h(hash, hashString(inst.tintColor));
			hash=h(hash, inst.tintPercent);
		break;
		
		case "brightness":
			hash=h(hash, inst.brightness);
		break;
			
	}
	
	switch(inst.symbolType) {
		case "graphic":
			hash=h(hash, hashString(inst.loop));
			hash=h(hash, hashString(inst.firstFrame));
		break;
		
		case "movieclip":
			hash=h(hash, hashString(inst.blendMode));
		break;
		
		case "button":
			hash=h(hash, hashString(inst.buttonTracking));
		break;
			
	}
	
	if(inst.visible) hash++;
	
	return hash;
}

function hashShape(elm) {
	var hash=0;
	
	for each(var vert in elm.vertices) {
		hash = h(hash,vert.x);
		hash = h(hash,vert.y);
	}
	
	for each(var edge in elm.edges) {
		var stroke=edge.stroke;
		if(stroke.style=="noStroke") continue;
		hash = h(hash, hashStroke(stroke));
	}
	
	for each(var contour in elm.contours) {
		var fill=contour.fill;
		hash = h(hash, hashFill(fill));
	}
	
	return hash+1;
}

function hashStroke(stroke) {
	var hash = hashString(stroke.style);
	hash = h(hash, hashFill(stroke.shapeFill));
	hash = h(hash, hashString(stroke.capType));
	hash = h(hash, hashString(stroke.joinType));
	hash = h(hash, hashString(stroke.scaleType));
	if(stroke.strokeHinting) hash++;
	hash = h(hash, stroke.thickness);
	hash = h(hash, stroke.miterLimit);
	
	switch(stroke.style) {
		case "dashed":
			hash=h(hash,stroke.dash1);
			hash=h(hash,stroke.dash2);
		break;
		case "dotted":
			hash=h(hash,hashString(stroke.dotSpace));
		break;
		case "hatched":
			hash=h(hash,hashString(stroke.curve));
			hash=h(hash,hashString(stroke.hatchThickness));
			hash=h(hash,hashString(stroke.jiggle));
			hash=h(hash,hashString(stroke.length));
			hash=h(hash,hashString(stroke.rotate));
			hash=h(hash,hashString(stroke.space));
		break;
		case "ragged":
			hash=h(hash,hashString(stroke.pattern));
			hash=h(hash,hashString(stroke.waveHeight));
			hash=h(hash,hashString(stroke.waveLength));
		break;
		case "stipple":
			hash=h(hash,hashString(stroke.density));
			hash=h(hash,hashString(stroke.dotSize));
			hash=h(hash,hashString(stroke.variation));
		break;
	}
	
	return hash;
}

function hashFill(fill) {
	var hash=hashString(fill.style);
	switch(fill.style) {
		case "solid":
			hash=h(hash, hashString(String(fill.color)));
		break;
		
		case "bitmap":
			hash=h(hash, hashString(fill.bitmapPath));
		break;
		
		case "linearGradient":
		case "radialGradient":
			for each(var color in fill.colorArray) {
				hash=h(hash, hashString(String(color)));
			}
			for each(var pos in fill.posArray) {
				hash=h(hash, pos);
			}
			hash=h(hash, hashString(fill.overflow));
			if(fill.linearRGB) hash++;
			hash=h(hash, hashMatrix(fill.matrix));
			
			if(fill.style=="linearGradient") {
				
			} else {
				
			}
		break;
	}
	
	return hash;
}

function h(x,y) {
	if(x===undefined) throw new Error("x Should not be undefined!");
	if(y===undefined) throw new Error("y Should not be undefined!");
	
	var hash = x;
	hash += 45;
	hash *= y;
	hash ^= y % 45318;
	return hash;
}

function hashString(str) {
	var hash=0;
	for(var i=0;i<str.length;++i) {
		var c=str.charCodeAt(i);
		hash *= c;
		hash += (c*c) % 483173;
		hash -= i*24;
		hash %= 78517145;
	}
	return hash;
}

function hashMatrix(m) {
	var hash = h(m.a, m.b);
	hash =h(hash, m.c);
	hash =h(hash, m.d);
	hash =h(hash, m.tx);
	hash =h(hash, m.ty);
	return hash;
}