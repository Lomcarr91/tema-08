
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.19.1 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    // (53:1) {#if scene == 'frontpage'}
    function create_if_block_3(ctx) {
    	let h3;
    	let t1;
    	let img;
    	let img_src_value;
    	let t2;
    	let t3;
    	let button;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*calls*/ ctx[0].length == 0) return create_if_block_4;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Call To Mind";
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			if_block.c();
    			t3 = space();
    			button = element("button");
    			button.textContent = "+";
    			attr_dev(h3, "class", "svelte-1goykpk");
    			add_location(h3, file, 53, 2, 849);
    			if (img.src !== (img_src_value = /*src*/ ctx[5])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*logo*/ ctx[6]);
    			attr_dev(img, "class", "svelte-1goykpk");
    			add_location(img, file, 54, 3, 874);
    			attr_dev(button, "id", "addTimer");
    			attr_dev(button, "class", "svelte-1goykpk");
    			add_location(button, file, 70, 2, 1309);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, img, anchor);
    			insert_dev(target, t2, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button, anchor);
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[11], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t3.parentNode, t3);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t2);
    			if_block.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(53:1) {#if scene == 'frontpage'}",
    		ctx
    	});

    	return block;
    }

    // (61:3) {:else}
    function create_else_block(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*calls*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*calls*/ 1) {
    				each_value_1 = /*calls*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(61:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (56:2) {#if calls.length == 0}
    function create_if_block_4(ctx) {
    	let div;
    	let h4;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h4 = element("h4");
    			h4.textContent = "Du har ingen planlagte anrop enda!";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Trykk på den det blå krysset i høyre hjørne for å registrere- og planlegge en telefonsamtale";
    			attr_dev(h4, "class", "svelte-1goykpk");
    			add_location(h4, file, 57, 4, 952);
    			attr_dev(p, "class", "svelte-1goykpk");
    			add_location(p, file, 58, 4, 1000);
    			attr_dev(div, "id", "intro");
    			attr_dev(div, "class", "svelte-1goykpk");
    			add_location(div, file, 56, 3, 931);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h4);
    			append_dev(div, t1);
    			append_dev(div, p);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(56:2) {#if calls.length == 0}",
    		ctx
    	});

    	return block;
    }

    // (62:4) {#each calls as call}
    function create_each_block_1(ctx) {
    	let div;
    	let h2;
    	let t0_value = /*call*/ ctx[21].name + "";
    	let t0;
    	let t1;
    	let p0;
    	let t2_value = /*call*/ ctx[21].phone + "";
    	let t2;
    	let t3;
    	let p1;
    	let t4_value = /*call*/ ctx[21].notes + "";
    	let t4;
    	let t5;
    	let p2;
    	let t6_value = /*call*/ ctx[21].hour + "";
    	let t6;
    	let t7;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			p0 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			p2 = element("p");
    			t6 = text(t6_value);
    			t7 = space();
    			attr_dev(h2, "class", "svelte-1goykpk");
    			add_location(h2, file, 63, 6, 1177);
    			attr_dev(p0, "class", "svelte-1goykpk");
    			add_location(p0, file, 64, 6, 1204);
    			attr_dev(p1, "class", "svelte-1goykpk");
    			add_location(p1, file, 65, 6, 1230);
    			attr_dev(p2, "class", "svelte-1goykpk");
    			add_location(p2, file, 66, 6, 1256);
    			attr_dev(div, "class", "call svelte-1goykpk");
    			add_location(div, file, 62, 5, 1152);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(p0, t2);
    			append_dev(div, t3);
    			append_dev(div, p1);
    			append_dev(p1, t4);
    			append_dev(div, t5);
    			append_dev(div, p2);
    			append_dev(p2, t6);
    			append_dev(div, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*calls*/ 1 && t0_value !== (t0_value = /*call*/ ctx[21].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*calls*/ 1 && t2_value !== (t2_value = /*call*/ ctx[21].phone + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*calls*/ 1 && t4_value !== (t4_value = /*call*/ ctx[21].notes + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*calls*/ 1 && t6_value !== (t6_value = /*call*/ ctx[21].hour + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(62:4) {#each calls as call}",
    		ctx
    	});

    	return block;
    }

    // (76:1) {#if scene == 'addcall'}
    function create_if_block_2(ctx) {
    	let h1;
    	let t1;
    	let div;
    	let input0;
    	let t2;
    	let input1;
    	let t3;
    	let input2;
    	let t4;
    	let input3;
    	let t5;
    	let button0;
    	let t7;
    	let button1;
    	let t9;
    	let button2;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Registrer påminnelse";
    			t1 = space();
    			div = element("div");
    			input0 = element("input");
    			t2 = space();
    			input1 = element("input");
    			t3 = space();
    			input2 = element("input");
    			t4 = space();
    			input3 = element("input");
    			t5 = space();
    			button0 = element("button");
    			button0.textContent = "Lagre";
    			t7 = space();
    			button1 = element("button");
    			button1.textContent = "Avbryt";
    			t9 = space();
    			button2 = element("button");
    			button2.textContent = "+";
    			attr_dev(h1, "id", "addCall");
    			attr_dev(h1, "class", "svelte-1goykpk");
    			add_location(h1, file, 76, 3, 1475);
    			attr_dev(input0, "placeholder", "navn");
    			attr_dev(input0, "class", "svelte-1goykpk");
    			add_location(input0, file, 78, 4, 1543);
    			attr_dev(input1, "placeholder", "telefonnummer");
    			attr_dev(input1, "class", "svelte-1goykpk");
    			add_location(input1, file, 79, 4, 1601);
    			attr_dev(input2, "placeholder", "notat");
    			attr_dev(input2, "class", "svelte-1goykpk");
    			add_location(input2, file, 80, 4, 1668);
    			attr_dev(input3, "placeholder", "sett inn hel time");
    			attr_dev(input3, "class", "svelte-1goykpk");
    			add_location(input3, file, 81, 4, 1727);
    			attr_dev(button0, "class", "acButton svelte-1goykpk");
    			add_location(button0, file, 82, 4, 1797);
    			attr_dev(button1, "class", "acButton svelte-1goykpk");
    			add_location(button1, file, 83, 4, 1860);
    			attr_dev(div, "id", "acBox");
    			attr_dev(div, "class", "svelte-1goykpk");
    			add_location(div, file, 77, 3, 1522);
    			attr_dev(button2, "id", "addTimer");
    			attr_dev(button2, "class", "svelte-1goykpk");
    			add_location(button2, file, 85, 3, 1952);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, input0);
    			set_input_value(input0, /*newcall*/ ctx[1].name);
    			append_dev(div, t2);
    			append_dev(div, input1);
    			set_input_value(input1, /*newcall*/ ctx[1].phone);
    			append_dev(div, t3);
    			append_dev(div, input2);
    			set_input_value(input2, /*newcall*/ ctx[1].notes);
    			append_dev(div, t4);
    			append_dev(div, input3);
    			set_input_value(input3, /*newcall*/ ctx[1].hour);
    			append_dev(div, t5);
    			append_dev(div, button0);
    			append_dev(div, t7);
    			append_dev(div, button1);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, button2, anchor);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[12]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[13]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[14]),
    				listen_dev(input3, "input", /*input3_input_handler*/ ctx[15]),
    				listen_dev(button0, "click", /*addCall*/ ctx[4], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[16], false, false, false),
    				listen_dev(button2, "click", /*click_handler_2*/ ctx[17], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*newcall*/ 2 && input0.value !== /*newcall*/ ctx[1].name) {
    				set_input_value(input0, /*newcall*/ ctx[1].name);
    			}

    			if (dirty & /*newcall*/ 2 && input1.value !== /*newcall*/ ctx[1].phone) {
    				set_input_value(input1, /*newcall*/ ctx[1].phone);
    			}

    			if (dirty & /*newcall*/ 2 && input2.value !== /*newcall*/ ctx[1].notes) {
    				set_input_value(input2, /*newcall*/ ctx[1].notes);
    			}

    			if (dirty & /*newcall*/ 2 && input3.value !== /*newcall*/ ctx[1].hour) {
    				set_input_value(input3, /*newcall*/ ctx[1].hour);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(button2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(76:1) {#if scene == 'addcall'}",
    		ctx
    	});

    	return block;
    }

    // (90:1) {#if scene == 'alarm'}
    function create_if_block(ctx) {
    	let h1;
    	let t1;
    	let t2;
    	let button;
    	let dispose;
    	let each_value = /*calls*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Alarm";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			button = element("button");
    			button.textContent = "+";
    			attr_dev(h1, "id", "addAlarm");
    			attr_dev(h1, "class", "svelte-1goykpk");
    			add_location(h1, file, 90, 2, 2122);
    			attr_dev(button, "id", "addTimer");
    			attr_dev(button, "class", "svelte-1goykpk");
    			add_location(button, file, 103, 2, 2518);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, button, anchor);
    			dispose = listen_dev(button, "click", /*click_handler_5*/ ctx[20], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*slumre, calls, callDone, time*/ 393) {
    				each_value = /*calls*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t2.parentNode, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(90:1) {#if scene == 'alarm'}",
    		ctx
    	});

    	return block;
    }

    // (93:3) {#if call.hour == time}
    function create_if_block_1(ctx) {
    	let div;
    	let h2;
    	let t0_value = /*call*/ ctx[21].name + "";
    	let t0;
    	let t1;
    	let p0;
    	let t2_value = /*call*/ ctx[21].phone + "";
    	let t2;
    	let t3;
    	let p1;
    	let t4_value = /*call*/ ctx[21].notes + "";
    	let t4;
    	let t5;
    	let p2;
    	let t6_value = /*call*/ ctx[21].hour + "";
    	let t6;
    	let t7;
    	let button0;
    	let t9;
    	let button1;
    	let dispose;

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[18](/*call*/ ctx[21], ...args);
    	}

    	function click_handler_4(...args) {
    		return /*click_handler_4*/ ctx[19](/*call*/ ctx[21], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			p0 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			p2 = element("p");
    			t6 = text(t6_value);
    			t7 = space();
    			button0 = element("button");
    			button0.textContent = "Ring";
    			t9 = space();
    			button1 = element("button");
    			button1.textContent = "Slumre";
    			attr_dev(h2, "class", "svelte-1goykpk");
    			add_location(h2, file, 94, 6, 2231);
    			attr_dev(p0, "class", "svelte-1goykpk");
    			add_location(p0, file, 95, 6, 2258);
    			attr_dev(p1, "class", "svelte-1goykpk");
    			add_location(p1, file, 96, 6, 2284);
    			attr_dev(p2, "class", "svelte-1goykpk");
    			add_location(p2, file, 97, 6, 2310);
    			attr_dev(button0, "class", "alarmButton svelte-1goykpk");
    			add_location(button0, file, 98, 6, 2335);
    			attr_dev(button1, "class", "alarmButton svelte-1goykpk");
    			add_location(button1, file, 99, 6, 2413);
    			attr_dev(div, "class", "call svelte-1goykpk");
    			add_location(div, file, 93, 4, 2206);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(p0, t2);
    			append_dev(div, t3);
    			append_dev(div, p1);
    			append_dev(p1, t4);
    			append_dev(div, t5);
    			append_dev(div, p2);
    			append_dev(p2, t6);
    			append_dev(div, t7);
    			append_dev(div, button0);
    			append_dev(div, t9);
    			append_dev(div, button1);

    			dispose = [
    				listen_dev(button0, "click", click_handler_3, false, false, false),
    				listen_dev(button1, "click", click_handler_4, false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*calls*/ 1 && t0_value !== (t0_value = /*call*/ ctx[21].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*calls*/ 1 && t2_value !== (t2_value = /*call*/ ctx[21].phone + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*calls*/ 1 && t4_value !== (t4_value = /*call*/ ctx[21].notes + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*calls*/ 1 && t6_value !== (t6_value = /*call*/ ctx[21].hour + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(93:3) {#if call.hour == time}",
    		ctx
    	});

    	return block;
    }

    // (92:2) {#each calls as call}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let if_block = /*call*/ ctx[21].hour == /*time*/ ctx[3] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*call*/ ctx[21].hour == /*time*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(92:2) {#each calls as call}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let t0;
    	let t1;
    	let if_block0 = /*scene*/ ctx[2] == "frontpage" && create_if_block_3(ctx);
    	let if_block1 = /*scene*/ ctx[2] == "addcall" && create_if_block_2(ctx);
    	let if_block2 = /*scene*/ ctx[2] == "alarm" && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(main, "class", "svelte-1goykpk");
    			add_location(main, file, 50, 0, 811);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t0);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t1);
    			if (if_block2) if_block2.m(main, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*scene*/ ctx[2] == "frontpage") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(main, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*scene*/ ctx[2] == "addcall") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(main, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*scene*/ ctx[2] == "alarm") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(main, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let calls = [];
    	let newcall = {};

    	//scene kan være frontpage | addcall | alarm
    	let scene = "frontpage";

    	const addCall = () => {
    		$$invalidate(0, calls = [newcall, ...calls]);
    		$$invalidate(1, newcall = {});
    		$$invalidate(2, scene = "frontpage");
    	};

    	let whatsthetime = 0;
    	let time;
    	let src = "Pics/call.gif"; // 
    	let logo = "Call to Mind";

    	//Alarm-delen
    	const slumre = call => {
    		let index = calls.indexOf(call);
    		console.log(index);
    		$$invalidate(0, calls[index].hour = new Date().getHours() + 1, calls);
    		$$invalidate(2, scene = "frontpage");
    	};

    	const callDone = call => {
    		$$invalidate(0, calls = calls.filter(c => c != call));
    		$$invalidate(2, scene = "frontpage");
    	};

    	const checkCalls = () => {
    		$$invalidate(3, time = new Date().getHours());

    		calls.map(call => {
    			if (call.hour == time) {
    				$$invalidate(2, scene = "alarm");
    			}
    		});
    	};

    	setInterval(checkCalls, 1000);
    	const click_handler = () => $$invalidate(2, scene = "addcall");

    	function input0_input_handler() {
    		newcall.name = this.value;
    		$$invalidate(1, newcall);
    	}

    	function input1_input_handler() {
    		newcall.phone = this.value;
    		$$invalidate(1, newcall);
    	}

    	function input2_input_handler() {
    		newcall.notes = this.value;
    		$$invalidate(1, newcall);
    	}

    	function input3_input_handler() {
    		newcall.hour = this.value;
    		$$invalidate(1, newcall);
    	}

    	const click_handler_1 = () => $$invalidate(2, scene = "frontpage");
    	const click_handler_2 = () => $$invalidate(2, scene = "addcall");
    	const click_handler_3 = call => callDone(call);
    	const click_handler_4 = call => slumre(call);
    	const click_handler_5 = () => $$invalidate(2, scene = "addcall");

    	$$self.$capture_state = () => ({
    		calls,
    		newcall,
    		scene,
    		addCall,
    		whatsthetime,
    		time,
    		src,
    		logo,
    		slumre,
    		callDone,
    		checkCalls,
    		console,
    		Date,
    		setInterval
    	});

    	$$self.$inject_state = $$props => {
    		if ("calls" in $$props) $$invalidate(0, calls = $$props.calls);
    		if ("newcall" in $$props) $$invalidate(1, newcall = $$props.newcall);
    		if ("scene" in $$props) $$invalidate(2, scene = $$props.scene);
    		if ("whatsthetime" in $$props) whatsthetime = $$props.whatsthetime;
    		if ("time" in $$props) $$invalidate(3, time = $$props.time);
    		if ("src" in $$props) $$invalidate(5, src = $$props.src);
    		if ("logo" in $$props) $$invalidate(6, logo = $$props.logo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*calls*/ 1) {
    			 console.log(calls);
    		}
    	};

    	return [
    		calls,
    		newcall,
    		scene,
    		time,
    		addCall,
    		src,
    		logo,
    		slumre,
    		callDone,
    		whatsthetime,
    		checkCalls,
    		click_handler,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
