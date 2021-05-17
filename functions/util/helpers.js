exports.createSubstringArray = (text) => {
    let textLowercased = text.toLowerCase();
	const texts = textLowercased.split(" ");
	const textsArray = texts.filter(item=>{
		return item!="";
	});
	let textsArrayCount = textsArray.length;

	var subsTextArray = [];
	var counter = -1;
	
    for(let i=0;i<textsArrayCount;i++){
			subsTextArray.push( textsArray[i] );
			counter+=1;
		for(let j=i+1;j<textsArrayCount;j++){
				subsTextArray.push( subsTextArray[counter] + " " + textsArray[j] );
				counter+=1;
		}
    }
	
	var substringArray = [];
	const subsTextArrayCount = subsTextArray.length;

    for(let i=0;i<subsTextArrayCount;i++){
		const text = subsTextArray[i];
		let characterCount = text.length;
		for(let i=0;i<characterCount;i++){
			for (let j=i+1;j<=characterCount;j++){
				if(text.substring(i,j)!=' '){
					substringArray.push(text.substring(i,j));
				}
			}
		}
	}

	const uniqueArray = [...new Set(substringArray)];

    return uniqueArray;
}


exports.createSubTextArray = (text) => {
    let textLowercased = text.toLowerCase();
	const texts = textLowercased.split(" ");
	const textsArray = texts.filter(item=>{
		return item!="";
	});
	let textsArrayCount = textsArray.length;

	var subsTextArray = [];
	var counter = -1;
	
    for(let i=0;i<textsArrayCount;i++){
			subsTextArray.push( textsArray[i] );
			counter+=1;
		for(let j=i+1;j<textsArrayCount;j++){
				subsTextArray.push( subsTextArray[counter] + " " + textsArray[j] );
				counter+=1;
		}
    }
	
	const uniqueArray = [...new Set(subsTextArray)];

    return uniqueArray;
}


exports.toFormatedNumber = (num) => {
	return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
