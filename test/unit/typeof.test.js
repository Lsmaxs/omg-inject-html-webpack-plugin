const { isString, isArray, isObject, isFunction, isNumber, isBoolean, isUndefined, isNull } = require( '../../lib/utils/typeof' );

describe( 'typeof utilities', () => {
    test( 'isString', () => {
        expect( isString( 'hello' ) ).toBe( true );
        expect( isString( '' ) ).toBe( true );
        expect( isString( 123 ) ).toBe( false );
        expect( isString( null ) ).toBe( false );
        expect( isString( undefined ) ).toBe( false );
        expect( isString( {} ) ).toBe( false );
        expect( isString( [] ) ).toBe( false );
    } );

    test( 'isArray', () => {
        expect( isArray( [] ) ).toBe( true );
        expect( isArray( [1, 2] ) ).toBe( true );
        expect( isArray( 'hello' ) ).toBe( false );
        expect( isArray( {} ) ).toBe( false );
        expect( isArray( null ) ).toBe( false );
    } );

    test( 'isObject', () => {
        expect( isObject( {} ) ).toBe( true );
        expect( isObject( { a: 1 } ) ).toBe( true );
        expect( isObject( [] ) ).toBe( false );
        expect( isObject( null ) ).toBe( false );
        expect( isObject( 'hello' ) ).toBe( false );
        expect( isObject( 123 ) ).toBe( false );
    } );
} );
