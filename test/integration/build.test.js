const path = require( 'path' );
const webpack = require( 'webpack' );
const fs = require( 'fs' );

function runWebpack ( configPath ) {
    return new Promise( ( resolve, reject ) => {
        const config = require( configPath );
        webpack( config, ( err, stats ) => {
            if ( err ) return reject( err );
            if ( stats.hasErrors() ) {
                return reject( new Error( stats.toString( { errorsOnly: true } ) ) );
            }
            resolve( stats );
        } );
    } );
}

describe( 'integration: build examples', () => {
    test( 'default example builds successfully', async () => {
        const configPath = path.resolve( __dirname, '../../example/default/webpack.config.js' );
        const stats = await runWebpack( configPath );
        expect( stats.hasErrors() ).toBe( false );
    } );

    test( 'ejs example builds successfully', async () => {
        const configPath = path.resolve( __dirname, '../../example/ejs/webpack.config.js' );
        const stats = await runWebpack( configPath );
        expect( stats.hasErrors() ).toBe( false );
    } );

    test( 'hbs example builds successfully', async () => {
        const configPath = path.resolve( __dirname, '../../example/hbs/webpack.config.js' );
        const stats = await runWebpack( configPath );
        expect( stats.hasErrors() ).toBe( false );
    } );

    test( 'inline example builds successfully', async () => {
        const configPath = path.resolve( __dirname, '../../example/inline/webpack.config.js' );
        const stats = await runWebpack( configPath );
        expect( stats.hasErrors() ).toBe( false );
    } );

    test( 'hbs output HTML contains script tags with crossorigin', async () => {
        const configPath = path.resolve( __dirname, '../../example/hbs/webpack.config.js' );
        await runWebpack( configPath );
        const htmlPath = path.resolve( __dirname, '../../example/hbs/dist/html/app.html' );
        const html = fs.readFileSync( htmlPath, 'utf8' );
        expect( html ).toContain( '<script' );
        expect( html ).toContain( 'crossorigin="anonymous"' );
        expect( html ).toContain( '<link' );
    } );

    test( 'inline output HTML contains inline script', async () => {
        const configPath = path.resolve( __dirname, '../../example/inline/webpack.config.js' );
        await runWebpack( configPath );
        const htmlPath = path.resolve( __dirname, '../../example/inline/dist/html/app.html' );
        const html = fs.readFileSync( htmlPath, 'utf8' );
        expect( html ).toContain( '<script>!function(e,t)' );
    } );
} );
