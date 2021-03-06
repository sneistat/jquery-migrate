
module("core");

test( "jQuery(html, props)", function() {
	expect( 3 );

	var $el = jQuery( "<input/>", { name: "name", val: "value", size: 42 } );

	equal( $el.attr("name"), "name", "Name attribute" );
	equal( $el.attr("size"), jQuery.isEmptyObject(jQuery.attrFn) ? undefined : "42", "Size attribute" );
	equal( $el.val(), "value", "Call setter method" );
});

test( "jQuery(html) loose rules", function() {
	expect( 25 );

	var w,
		nowarns = {
			"simple tag": "<div />",
			"single tag with properties": "<input type=text name=easy />",
			"complex html": "<div id='good'><p id='guy'> hello !</p></div>"
		},
		warns = {
			"leading space": "  <div />",
			"leading newline": "\n<div />",
			"leading text": "don't<div>try this</div>",
			"trailing text": "<div>try this</div>junk",
			"both text": "don't<div>try this</div>either"
		},
		generate = function( html ) {
			return function() {
				var el = jQuery( html );

				equal( el.length, 1, html + " succeeded" );
				equal( el.parent().length, 0, html + " generated new content" );
			};
		};

	for ( w in nowarns ) {
		expectNoWarning( w, generate( nowarns[w] ) );
	}
	for ( w in warns ) {
		expectWarning( w, generate( warns[w] ) );
	}

	// Bad HTML will throw on some supported versions
	expectWarning( "leading hash", function() {
		try {
			jQuery("#yeah<p>RIGHT</p>");
		} catch ( e ) {}
	});
});

test( "jQuery.parseJSON() falsy values", function() {
	expect(6);

	expectNoWarning( "valid JSON", function() {
		jQuery.parseJSON("{\"a\":1}");
	});
	expectNoWarning( "actual null", function() {
		jQuery.parseJSON(null);
	});
	expectNoWarning( "string null", function() {
		jQuery.parseJSON("null");
	});
	expectWarning( "empty string", function() {
		jQuery.parseJSON("");
	});
	expectWarning( "Boolean false", function() {
		jQuery.parseJSON(false);
	});
	expectWarning( "undefined", function() {
		jQuery.parseJSON(undefined);
	});
});

test( "jQuery.browser", function() {
	expect( 3 );

	( jQuery._definePropertyBroken ? expectNoWarning : expectWarning )( "browser", function() {
		ok( jQuery.browser, "jQuery.browser present" );
		ok( jQuery.browser.version, "have a browser version" );
	});
});

test( "jQuery.sub() - Static Methods", function(){
	expect( 19 );

	var Subclass;

	// Other warnings may be fired when props are copied
	expectWarning( "jQuery.sub", function() {
		Subclass = jQuery.sub();
	});

	Subclass.extend({
		"topLevelMethod": function() {return this.debug;},
		"debug": false,
		"config": {
			"locale": "en_US"
		},
		"setup": function(config) {
			this.extend(true, this["config"], config);
		}
	});
	Subclass.fn.extend({"subClassMethod": function() { return this;}});

	//Test Simple Subclass
	ok(Subclass["topLevelMethod"]() === false, "Subclass.topLevelMethod thought debug was true");
	ok(Subclass["config"]["locale"] == "en_US", Subclass["config"]["locale"] + " is wrong!");
	deepEqual(Subclass["config"]["test"], undefined, "Subclass.config.test is set incorrectly");
	equal(jQuery.ajax, Subclass.ajax, "The subclass failed to get all top level methods");

	//Create a SubSubclass
	var SubSubclass = Subclass.sub();

	//Make Sure the SubSubclass inherited properly
	ok(SubSubclass["topLevelMethod"]() === false, "SubSubclass.topLevelMethod thought debug was true");
	ok(SubSubclass["config"]["locale"] == "en_US", SubSubclass["config"]["locale"] + " is wrong!");
	deepEqual(SubSubclass["config"]["test"], undefined, "SubSubclass.config.test is set incorrectly");
	equal(jQuery.ajax, SubSubclass.ajax, "The subsubclass failed to get all top level methods");

	//Modify The Subclass and test the Modifications
	SubSubclass.fn.extend({"subSubClassMethod": function() { return this;}});
	SubSubclass["setup"]({"locale": "es_MX", "test": "worked"});
	SubSubclass["debug"] = true;
	SubSubclass.ajax = function() {return false;};
	ok(SubSubclass["topLevelMethod"](), "SubSubclass.topLevelMethod thought debug was false");
	deepEqual(SubSubclass(document)["subClassMethod"], Subclass.fn["subClassMethod"], "Methods Differ!");
	ok(SubSubclass["config"]["locale"] == "es_MX", SubSubclass["config"]["locale"] + " is wrong!");
	ok(SubSubclass["config"]["test"] == "worked", "SubSubclass.config.test is set incorrectly");
	notEqual(jQuery.ajax, SubSubclass.ajax, "The subsubclass failed to get all top level methods");

	//This shows that the modifications to the SubSubClass did not bubble back up to it's superclass
	ok(Subclass["topLevelMethod"]() === false, "Subclass.topLevelMethod thought debug was true");
	ok(Subclass["config"]["locale"] == "en_US", Subclass["config"]["locale"] + " is wrong!");
	deepEqual(Subclass["config"]["test"], undefined, "Subclass.config.test is set incorrectly");
	deepEqual(Subclass(document)["subSubClassMethod"], undefined, "subSubClassMethod set incorrectly");
	equal(jQuery.ajax, Subclass.ajax, "The subclass failed to get all top level methods");
});

test( "jQuery.sub() - .fn Methods", function(){
	expect( 378 );

	var Subclass = jQuery.sub(),
		SubclassSubclass = Subclass.sub(),
		jQueryDocument = jQuery(document),
		selectors, contexts, methods, method, arg, description;

	jQueryDocument.toString = function(){ return "jQueryDocument"; };

	Subclass.fn.subclassMethod = function(){};
	SubclassSubclass.fn.subclassSubclassMethod = function(){};

	selectors = [
		"body",
		"html, body",
		"<div></div>"
	];

	contexts = [undefined, document, jQueryDocument];

	jQuery.expandedEach = jQuery.each;
	jQuery.each(selectors, function(i, selector){

		jQuery.expandedEach({ // all methods that return a new jQuery instance
			"eq": 1 ,
			"add": document,
			"end": undefined,
			"has": undefined,
			"closest": "div",
			"filter": document,
			"find": "div"
		}, function(method, arg){
			jQuery.each(contexts, function(i, context){

				description = "(\""+selector+"\", "+context+")."+method+"("+(arg||"")+")";

				deepEqual(
					(function(var_args){ return jQuery.fn[method].apply(jQuery(selector, context), arguments).subclassMethod; })(arg),
					undefined, "jQuery"+description+" doesn't have Subclass methods"
				);
				deepEqual(
					(function(var_args){ return jQuery.fn[method].apply(jQuery(selector, context), arguments).subclassSubclassMethod; })(arg),
					undefined, "jQuery"+description+" doesn't have SubclassSubclass methods"
				);
				deepEqual(
					Subclass(selector, context)[method](arg).subclassMethod, Subclass.fn.subclassMethod,
					"Subclass"+description+" has Subclass methods"
				);
				deepEqual(
					Subclass(selector, context)[method](arg).subclassSubclassMethod, undefined,
					"Subclass"+description+" doesn't have SubclassSubclass methods"
				);
				deepEqual(
					SubclassSubclass(selector, context)[method](arg).subclassMethod, Subclass.fn.subclassMethod,
					"SubclassSubclass"+description+" has Subclass methods"
				);
				deepEqual(
					SubclassSubclass(selector, context)[method](arg).subclassSubclassMethod, SubclassSubclass.fn.subclassSubclassMethod,
					"SubclassSubclass"+description+" has SubclassSubclass methods"
				);

			});
		});
	});
});
