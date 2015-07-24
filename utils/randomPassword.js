var randomPassword = function() { 
	var text=['abcdefghijklmnopqrstuvwxyz','ABCDEFGHIJKLMNOPQRSTUVWXYZ','1234567890','~!@#$%^&*()_+";",./?<>']; 
	var rand = function(min, max){return Math.floor(Math.max(min, Math.random() * (max+1)));} 
	var len = 32;
	var pw = ''; 
	for(i=0; i<len; ++i) { 
		var strpos = rand(0, 3); 
		pw += text[strpos].charAt(rand(0, text[strpos].length)); 
	} 
	return pw; 
}
module.exports = randomPassword;