(function() {
	'use strict';

	var deck = bespoke.from('article');
	bespoke.from('article', {
		keys: true,
		progress: true,
		hash: true,
	});

	var KEYWORDS = [
		'int', 'return', '#include', 'for', 'if', 'switch', 'case', 'default',
		'fn', 'pub', 'let', 'match', 'in', 'unsafe', 'extern', 'trait', 'impl',
		'func', 'package', 'var', 'import', 'go', 'make', 'type', 'struct', 'string'
	];
	var DELIM = '([^\\w]|^|$)';

	var pre = document.querySelectorAll('.lang');
	for (var i = 0; i < pre.length; i++) {
		var s = pre[i].innerHTML;
		s = s.replace(/^\s+/gm, function(m) {
			console.log('replace', m);
			return m.replace(' ', '  ');
		});
		for (var j = 0 ; j < KEYWORDS.length; j++) {
			s = s.replace(new RegExp(DELIM+'('+KEYWORDS[j]+')'+DELIM, 'g'), '$1<b>$2</b>$3');
		}
		pre[i].innerHTML = '<pre>' + s + '</pre>';
	}
})();
