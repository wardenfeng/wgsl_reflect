import { assert, describe, it } from 'vitest';
const { ok, equal, deepEqual, strictEqual, notDeepEqual } = assert;

import { Function, If, WgslParser } from '../src';
import { validateObject } from './common';

describe('Parser', () =>
{
    const parser = new WgslParser();

    it('empty', () =>
    {
        equal(parser.parse().length, 0);
        equal(parser.parse('').length, 0);
        equal(parser.parse([]).length, 0);
    });

    it(';;;;', () =>
    {
        equal(parser.parse(';;;;').length, 0);
    });

    // enable:
    it('enable foo;', () =>
    {
        const t: any = parser.parse('enable foo;');
        validateObject(t, [
            {
                astNodeType: 'enable',
                name: 'foo',
            },
        ]);
    });

    // alias:
    it('alias', () =>
    {
        const t: any = parser.parse('alias foo = i32;');
        validateObject(t, [
            {
                astNodeType: 'alias',
                name: 'foo',
                type: { name: 'i32' },
            },
        ]);
    });

    it('alias foo = vec3<f32>;', () =>
    {
        const t: any = parser.parse('alias foo = vec3<f32>;');
        validateObject(t, [
            {
                astNodeType: 'alias',
                name: 'foo',
                type: {
                    name: 'vec3',
                    format: {
                        name: 'f32',
                    },
                },
            },
        ]);
    });

    it('alias foo = array<f32, 5>;', () =>
    {
        const t: any = parser.parse('alias foo = array<f32, 5>;');
        validateObject(t, [
            {
                astNodeType: 'alias',
                name: 'foo',
                type: {
                    name: 'array',
                    format: {
                        name: 'f32',
                    },
                    count: 5,
                },
            },
        ]);
    });

    it('alias foo = @stride(16) array<vec4<f32>>;', () =>
    {
        const t = parser.parse('alias foo = @stride(16) array<vec4<f32>>;');
        equal(t.length, 1);
    });

    // var
    it('var<private> decibels: f32;', () =>
    {
        const t = parser.parse('var<private> decibels: f32;');
        equal(t.length, 1);
    });

    it('var<workgroup> worklist: array<i32,10>;', () =>
    {
        const t = parser.parse('var<workgroup> worklist: array<i32,10>;');
        equal(t.length, 1);
    });

    it('@group(0) @binding(2) var<uniform> param: Params;', () =>
    {
        const t = parser.parse('@group(0) @binding(2) var<uniform> param: Params;');
        equal(t.length, 1);
    });

    it('@group(0) binding(0) var<storage,read_write> pbuf: PositionsBuffer;', () =>
    {
        const t: any = parser.parse(
            '@group(0) @binding(0) var<storage,read_write> pbuf: PositionsBuffer;'
        );
        validateObject(t, [
            {
                astNodeType: 'var',
                name: 'pbuf',
                attributes: [
                    {
                        name: 'group',
                        value: '0',
                    },
                    {
                        name: 'binding',
                        value: '0',
                    },
                ],
            },
        ]);
    });

    // let
    it('let golden: f32 = 1.61803398875;', () =>
    {
        const t: any = parser.parse('let golden: f32 = 1.61803398875;');
        validateObject(t, [
            {
                astNodeType: 'let',
                name: 'golden',
                type: {
                    name: 'f32',
                },
                value: { value: '1.61803398875' },
            },
        ]);
    });

    it('let e2 = vec3<i32>(0,1,0);', () =>
    {
        const t: any = parser.parse('let e2 = vec3<i32>(0,1,0);');
        validateObject(t, [
            {
                astNodeType: 'let',
                name: 'e2',
                value: {
                    astNodeType: 'createExpr',
                    type: {
                        name: 'vec3',
                        format: {
                            name: 'i32',
                        },
                    },
                },
            },
        ]);
    });

    // struct

    it('struct', () =>
    {
        const code = `
struct S {
    @offset(0) a: f32,
    b: f32,
    data: RTArr,
}`;
        const t = parser.parse(code);
        equal(t.length, 1);
    });

    // let
    it('let x : i32 = 42;', () =>
    {
        const t: any = parser.parse('let x : i32 = 42;');
        validateObject(t, [
            {
                astNodeType: 'let',
                name: 'x',
            },
        ]);
    });

    // function
    it('fn it() { let x : i32 = 42; }', () =>
    {
        const t = parser.parse('fn it() { let x : i32 = 42; }');
        equal(t.length, 1);
    });

    it('@vertex fn vert_main() -> @builtin(position) vec4<f32> {}', () =>
    {
        const t = parser.parse(
            '@vertex fn vert_main() -> @builtin(position) vec4<f32> {}'
        );
        equal(t.length, 1);
    });

    it('var W_out_origX0X : texture_storage_2d<rgba16float, write>;', () =>
    {
        const t = parser.parse(
            'var W_out_origX0X : texture_storage_2d<rgba16float, write>;'
        );
        equal(t.length, 1);
    });

    it('if (foo) { }', () =>
    {
        const t = parser.parse('fn it() { if (foo) { } }');
        equal(t.length, 1);
    });

    it('if foo { }', () =>
    {
        const t = parser.parse('fn it() { if foo { } }');
        equal(t.length, 1);
    });

    it('switch foo { case 0: {} default: {} }', () =>
    {
        const t = parser.parse(
            'fn it() { switch foo { case 0: {} default: {} } }'
        );
        equal(t.length, 1);
    });

    it('switch foo { }', () =>
    {
        const t = parser.parse('fn it() { switch foo { default: { } } }');
        equal(t.length, 1);
    });

    it('trailing_comma', () =>
    {
        const t = parser.parse('fn foo (a:i32,) {}');
        equal(t.length, 1);
    });

    it('operators', () =>
    {
        const t: any = parser.parse(`fn foo() {
            var b = 1;
            b+=1;
            b-=1;
            b*=1;
            b/=1;
            b&=1;
            b|=1;
            b^=1;
            b>>=1;
            b<<=1;
            b++;
            b--;
        }`);
        equal(t[0].body.length, 12);
    });

    it('static_assert', () =>
    {
        const t = parser.parse(`fn foo() {
            const x = 1;
            const y = 2;
            static_assert x < y; // valid at module-scope.
            static_assert(y != 0); // parentheses are optional.
        }`);
    });

    it('for incrementer', () =>
    {
        const t: any = parser.parse(`fn foo() {
            for (var i = 0; i < 10; i++) {
            }

            for (var i = 0; i < 10; i += 5) {
            }

            for (var i = 0; i < 10; i = 20) {
            }

            for (var i = 0; i < 10; f(i)) {
            }
        }`);

        equal(t[0].body.length, 4);
        equal(t[0].body[0].increment.astNodeType, 'increment');
        equal(t[0].body[1].increment.astNodeType, 'assign');
        equal(t[0].body[2].increment.astNodeType, 'assign');
        equal(t[0].body[3].increment.astNodeType, 'call');
    });

    it('inferred type arrays', () =>
    {
        const t: any = parser.parse(`
        @vertex fn vs(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
        let pos = array(
          vec2f( 0.0,  0.5),  // top center
          vec2f(-0.5, -0.5),  // bottom left
          vec2f( 0.5, -0.5)   // bottom right
        );

        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }`);

        equal(t[0].body.length, 2);
    });

    it('if (foo < 0.33333) { } else if foo < 0.66667 {} else {}', function (test)
    {
        const t = parser.parse('fn test() { if (foo < 0.33333) { } else if foo < 0.66667 {} else {} }');

        equal(((t[0] as Function).body[0] as If).elseif.length, 1);

        const t1 = parser.parse('fn test() { if (foo < 0.33333) { } else if foo < 0.66667 {}  else if (foo < 0.86667) {} else {} }');

        equal(((t1[0] as Function).body[0] as If).elseif.length, 2);
    });
});