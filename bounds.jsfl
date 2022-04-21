function elementsBounds(elements) {
	var minX=Infinity;
	var maxX=-Infinity;
	var minY=Infinity;
	var maxY=-Infinity;
	
	for each(var elm in elements) {
		if(elm.elementType=="instance") {
		} else if(elm.elementType=="shape") {
			
			if(elm.isGroup) {
				for each(var subElm in elm.members) {
					fl.trace(subElm);
				}
			}
		
			if(elm.vertices.length<1) continue;
		} else if(elm.elementType=="text") {
		} else {
			fl.trace(elm.elementType);
		}
	
		var right=elm.left+elm.width;
		var bottom=elm.top+elm.height;

		if(elm.left<minX) minX=elm.left;
		if(right>maxX) maxX=right;
		if(elm.top<minY) minY=elm.top;
		if(bottom>maxY) maxY=bottom;
	
		//fl.trace(elm.left.toFixed(2)+","+right.toFixed(2)+","+elm.top.toFixed(2)+","+bottom.toFixed(2)+" "+elm.isGroup+" "+elm.isDrawingObject);
	}

	if(!isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

	return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
}