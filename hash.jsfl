function hashSymbol(symb, xOff, yOff) {
	var hash=0;
	if(symb.itemType=="graphic" || symb.itemType=="movie clip" || symb.itemType=="button") {
		hash=hashTimeline(symb.timeline, xOff, yOff);
	}
	
	if(symb.linkageExportForAS) {
		hash=h(hash, hashString(symb.linkageClassName));
	}

	return hash;
}

function hashTimeline(tl, xOff, yOff) {
	var hash=0;
	for each(var layer in tl.layers) {
		var hash2= h(hash,hashLayer(layer, xOff, yOff));
		//fl.trace(layer.name+" "+hash2);
		hash = hash2;
	}
	return hash;
}

function hashLayer(layer, xOff, yOff) {
	var hash=hashString(layer.layerType);
	var frames=layer.frames;
	var n=frames.length;
	for(var i=0;i<n;++i) {
		var frame=frames[i];
		if(i!=frame.startFrame) continue;
		var hash2=hashFrame(frame, xOff, yOff);
		hash = h(hash,hash2);
	}
	return hash+1;
}

function hashFrame(frame, xOff, yOff) {
	var hash=h(frame.duration,frame.startFrame);
	for each(var elm in frame.elements) {
		var hash2=hashElement(elm, xOff, yOff);
		hash = h(hash,hash2);
	}
	if(frame.actionScript!="") {
		hash=h(hash,hashString(frame.actionScript));
	}
	if(frame.labelType!="none") {
		hash=h(hash,hashString(frame.labelType));
		hash=h(hash,hashString(frame.name));
	}
	if(frame.soundLibraryItem) {
		hash=h(hash,hashString(frame.soundLibraryItem.name));
		hash=h(hash,hashString(frame.soundSync))
	}
	if(frame.tweenType!="none") {
		hash+=(frame.motionTweenScale?1:0);
		hash=h(hash, hashString(frame.tweenType));
		hash+=(frame.motionTweenOrientToPath?1:0);
		hash=h(hash, hashString(frame.motionTweenRotate));
		hash+=(frame.motionTweenSnap?1:0);
		hash=h(hash, frame.motionTweenRotateTimes);
		hash+=(frame.motionTweenSync?1:0);
	}
	return hash+1;
}

function hashElement(elm, xOff, yOff) {
	var hash = hashMatrix(elm.matrix);
	if(elm.name!="") {
		hash=h(hash, hashString(elm.name));
	}
		
	switch(elm.elementType) {
		case "shape":
			hash += hashShape(elm, xOff, yOff);
		break;
		case "instance": 
			hash += hashString(elm.libraryItem.name);
			switch(elm.instanceType) {
				case "symbol":
					hash += hashSymbolInstance(elm, xOff, yOff);
				break;
			}
		break;
		case "text":
			hash += hashText(elm);
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

function hashSymbolInstance(inst, xOff, yOff) {
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

function hashShape(elm, xOff, yOff) {
	var hash=0;
	
	for each(var vert in elm.vertices) {
		hash = h(hash,roundD(vert.x-xOff,1000));
		hash = h(hash,roundD(vert.y-yOff,1000));
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
	
	for each(var groupMember in elm.members) {
		hash = h(hash, hashElement(groupMember, xOff, yOff));
	}
	
	return hash+1;
}

function roundD(x, scale) {
	return Math.round(x*scale+0.0000001)/scale;
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
		hash = (1000003 * hash) ^ c;
	}
	return hash ^ str.length;
}

function hashMatrix(m) {
	var hash = h(m.a, m.b);
	hash =h(hash, m.c);
	hash =h(hash, m.d);
	hash =h(hash, m.tx);
	hash =h(hash, m.ty);
	return hash;
}