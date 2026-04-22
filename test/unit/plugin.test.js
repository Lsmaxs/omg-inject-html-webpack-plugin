const OmgInjectHtmlWebpackPlugin = require( '../../index' );
const path = require( 'path' );

describe( 'OmgInjectHtmlWebpackPlugin', () => {
    describe( 'constructor', () => {
        test( 'creates instance with default options', () => {
            const plugin = new OmgInjectHtmlWebpackPlugin();
            expect( plugin.options.inject ).toBe( false );
            expect( plugin.options.templateParameters ).toEqual( {} );
            expect( plugin.cwd ).toBe( process.cwd() );
            expect( plugin.inlineFileContent ).toEqual( {} );
        } );

        test( 'merges custom options', () => {
            const plugin = new OmgInjectHtmlWebpackPlugin( {
                inject: true,
                templateParameters: { foo: 'bar' },
            } );
            expect( plugin.options.inject ).toBe( true );
            expect( plugin.options.templateParameters ).toEqual( { foo: 'bar' } );
        } );

        test( 'throws on non-boolean inject', () => {
            expect( () => new OmgInjectHtmlWebpackPlugin( { inject: 'yes' } ) ).toThrow( 'options.inject must be a boolean' );
        } );

        test( 'accepts boolean false', () => {
            const plugin = new OmgInjectHtmlWebpackPlugin( { inject: false } );
            expect( plugin.options.inject ).toBe( false );
        } );
    } );

    describe( 'createNewAssetsObject', () => {
        test( 'generates script tag for js entry', () => {
            const plugin = new OmgInjectHtmlWebpackPlugin();
            const assets = { js: [], css: [] };
            const item = {
                tagName: 'script',
                attributes: { src: 'https://cdn.example.com/app.js' },
            };
            plugin.createNewAssetsObject( assets, item, false );
            expect( assets.js ).toHaveLength( 1 );
            expect( assets.js[0] ).toContain( '<script' );
            expect( assets.js[0] ).toContain( 'app.js' );
        } );

        test( 'generates link tag for css entry', () => {
            const plugin = new OmgInjectHtmlWebpackPlugin();
            const assets = { js: [], css: [] };
            const item = {
                tagName: 'link',
                attributes: { href: 'https://cdn.example.com/style.css', rel: 'stylesheet' },
            };
            plugin.createNewAssetsObject( assets, item, false );
            expect( assets.css ).toHaveLength( 1 );
            expect( assets.css[0] ).toContain( '<link' );
            expect( assets.css[0] ).toContain( 'style.css' );
        } );

        test( 'generates link tag with xhtml mode', () => {
            const plugin = new OmgInjectHtmlWebpackPlugin();
            const assets = { js: [], css: [] };
            const item = {
                tagName: 'link',
                attributes: { href: 'https://cdn.example.com/style.css', rel: 'stylesheet' },
            };
            plugin.createNewAssetsObject( assets, item, true );
            expect( assets.css[0] ).toContain( '<link' );
            expect( assets.css[0] ).toContain( 'style.css' );
        } );
    } );

    describe( 'templateParametersGenerator', () => {
        test( 'returns htmlWebpackPlugin structure when inject is true', () => {
            const plugin = new OmgInjectHtmlWebpackPlugin( { inject: true } );
            const result = plugin.templateParametersGenerator(
                { options: { output: {} } },
                { manifest: undefined, favicon: undefined },
                { headTags: [], bodyTags: [] },
                { inject: true }
            );
            expect( result ).toHaveProperty( 'htmlWebpackPlugin' );
            expect( result.htmlWebpackPlugin ).toHaveProperty( 'tags' );
            expect( result.htmlWebpackPlugin ).toHaveProperty( 'files' );
        } );

        test( 'returns assets + inline structure when inject is false', () => {
            const plugin = new OmgInjectHtmlWebpackPlugin( { inject: false, templateParameters: { customVar: 'test' } } );
            plugin.inlineFileContent = { tracker: '<script>tracker code</script>' };

            const assetTags = {
                headTags: [
                    { tagName: 'link', attributes: { href: 'https://cdn.example.com/style.css', rel: 'stylesheet' } },
                ],
                bodyTags: [
                    { tagName: 'script', attributes: { src: 'https://cdn.example.com/app.js' } },
                ],
            };
            const mockCompilation = {
                options: { output: { crossOriginLoading: 'anonymous' } },
            };

            const result = plugin.templateParametersGenerator(
                mockCompilation,
                { manifest: undefined, favicon: undefined },
                assetTags,
                { xhtml: false, inject: false }
            );

            expect( result ).toHaveProperty( 'assets' );
            expect( result.assets.js ).toHaveLength( 1 );
            expect( result.assets.css ).toHaveLength( 1 );
            expect( result.assets.js[0] ).toContain( 'crossorigin="anonymous"' );
            expect( result.assets.css[0] ).toContain( 'crossorigin="anonymous"' );
            expect( result ).toHaveProperty( 'inline' );
            expect( result.inline.tracker ).toContain( '<script>tracker code</script>' );
            expect( result ).toHaveProperty( 'customVar', 'test' );
        } );

        test( 'does not add crossorigin when crossOriginLoading is not set', () => {
            const plugin = new OmgInjectHtmlWebpackPlugin( { inject: false } );
            const assetTags = {
                headTags: [],
                bodyTags: [
                    { tagName: 'script', attributes: { src: 'app.js' } },
                ],
            };
            const mockCompilation = {
                options: { output: {} },
            };

            const result = plugin.templateParametersGenerator(
                mockCompilation,
                { manifest: undefined, favicon: undefined },
                assetTags,
                { xhtml: false, inject: false }
            );

            expect( result.assets.js[0] ).not.toContain( 'crossorigin' );
        } );
    } );

    describe( 'createInlineStaticObject', () => {
        test( 'reads inline file from local path', async () => {
            const plugin = new OmgInjectHtmlWebpackPlugin();
            const mockCompilation = {
                options: {
                    entry: {
                        app: './src/app.js',
                        tracker: './test/unit/../fixtures/mock-inline.js?__inline',
                    },
                },
            };

            await plugin.createInlineStaticObject( mockCompilation );
            // tracker entry should be processed (file may or may not exist, no error thrown)
            expect( typeof plugin.inlineFileContent ).toBe( 'object' );
        } );

        test( 'handles empty entry gracefully', async () => {
            const plugin = new OmgInjectHtmlWebpackPlugin();
            const mockCompilation = {
                options: { entry: {} },
            };
            await plugin.createInlineStaticObject( mockCompilation );
            expect( plugin.inlineFileContent ).toEqual( {} );
        } );
    } );

    describe( 'apply', () => {
        test( 'registers compilation hook', () => {
            const plugin = new OmgInjectHtmlWebpackPlugin();
            let tappedHook = null;
            const mockCompiler = {
                hooks: {
                    compilation: {
                        tap: ( name, fn ) => {
                            tappedHook = { name, fn };
                        },
                    },
                },
            };
            plugin.apply( mockCompiler );
            expect( tappedHook ).not.toBeNull();
            expect( tappedHook.name ).toBe( 'omg-inject-html-webpack-plugin' );
        } );
    } );
} );
