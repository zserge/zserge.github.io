window.$=function(e,t,l){var n={"#":"getElementById",".":"getElementsByClassName","@":"getElementsByName","=":"getElementsByTagName","*":"querySelectorAll"}[e[0]],m=(t===l?document:t)[n](e.slice(1));return m.length<2?m[0]:m};


(function() {
	'use strict';

	var deck = bespoke.from('article');
	bespoke.horizontal.from('article', {
		progress: true,
		hash: true
	});
	initKeys();

	function initKeys() {
		if (/Firefox/.test(navigator.userAgent)) {
			document.addEventListener('keydown', function(e) {
				if (e.which >= 37 && e.which <= 40) {
					e.preventDefault();
				}
			});
		}

		document.addEventListener('keydown', function(e) {
			var key = e.which;
			key === 37 && deck.prev();
			//(key === 32 || key === 39) && deck.next();
			(key === 39) && deck.next();
		});
	}

	var demos = document.querySelectorAll('section.demo');
	for (var i = 0; i < demos.length; i++) {
		demos[i].querySelector('.demo-btn').onclick = (function(section) {
			return function() {
				var src = section.querySelector('.demo-input textarea');
				var out = section.querySelector('.demo-output');
				var cb = section.getAttribute('data-demo-fn');
				var input = src.value;
				console.log(input, out);
				window[cb](input, out);
				return false;
			};
		})(demos[i]);
	}
}());

function demoLexer(code, out) {
	try {
		var tokens = lexer.parse(code);
		out.innerHTML = JSON.stringify(tokens);
	} catch (e) {
		out.innerHTML = 'Error: ' + e;
		console.log(e);
	}
}

function demoParser(code, out) {
	function stringify(o) {
		if (o instanceof Array) {
			var s = '[ ';
			for (var i = 0; i < o.length; i++) {
				s = s + stringify(o[i]) + ' ';
			}
			s = s + ']';
			return s;
		} else {
			return o.tok + ':' + o.val;
		}
	}
	try {
		var tokens = parser.parse(code);
		out.innerHTML = stringify(tokens);
	} catch (e) {
		out.innerHTML = 'Error: ' + e;
		console.log(e);
	}
}

function call(f, env, funcs) {
	if (f.tok == 'S' || f.tok == 'N') {
		return f.val;
	}

	if (f.tok == 'I') {
		return env[f.val] || 0;
	}
	if (f.length == 1 && f[0].tok == 'I') {
		return env[f[0].val] || 0;
	}

	if (f[0].tok == 'B' && f[0].val == 'set') {
		return env[f[1].val] = call(f[2], env, funcs);
	}

	if (funcs[f[0].val]) {
		return funcs[f[0].val](f.slice(1))
	} else {
		throw('Unknown function: ' + f[0].val);
	}
}

function run(ast, labels, env, funcs) {
	pc = 0; // global
	while (pc < ast.length) {
		var node = ast[pc++];
		var n = node[0];
		if (n && n.tok == 'L') {
			labels[n.val] = pc;
		}
	}
	pc = 0;
	while (pc < ast.length) {
		var node = ast[pc++];
		var n = node[0];
		if (n && n.tok == 'L') {
			continue;
		} else if (n.tok == 'B' && n.val == 'if') {
			var ok = call(node[1], env, funcs);
			if (ok) {
				call(node[2], env, funcs);
			}
		} else {
			call(node, env, funcs);
		}
	}
}

function demoEval(code, el) {
	var env = {};
	var labels = {};
	var funcs = {
		'print': function(args) {
			el.innerHTML += (args.map(function(i) {
				if (i.tok == 'I') return env[i.val] || 0;
				if (i.tok == 'N' || i.tok == 'S') return i.val;
			}).join('\t'));
			el.innerHTML += '<br/>';
			return 0;
		},
		'eq': function(args) { return call(args[0], env, funcs) == call(args[1], env, funcs) ? 1 : 0},
		'neq': function(args) { return call(args[0], env, funcs) != call(args[1], env, funcs) ? 1 : 0},
		'less': function(args) { return call(args[0], env, funcs) < call(args[1], env, funcs) ? 1 : 0},
		'lesseq': function(args) { return call(args[0], env, funcs) <= call(args[1], env, funcs) ? 1 : 0},
		'minus': function(args) { return call(args[0], env, funcs) - call(args[1], env, funcs)},
		'plus': function(args) { return call(args[0], env, funcs) + call(args[1], env, funcs)},
		'goto': function(args) { pc = labels[args[0].val] - 1; },
	}
	el.innerHTML = '';
	try {
		var tokens = parser.parse(code);
		run(tokens, labels, env, funcs);
	} catch (e) {
		el.innerHTML = 'Error: ' + e;
		console.log(e);
	}
}

