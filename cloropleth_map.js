var openLayersChoropleth = (function(){
	
	var map,
		mapShapes,
		mapStyles,
		tooltip,
		range1,
		range2,
		range3,
		range4,
		range5,
		breaksIndex = 0;
	
	/**
	* Creates an OpenLayers map view with a blank base layer.
	*/
	function createMap(containerId){
		var map = new OpenLayers.Map(containerId, {
			projection: new OpenLayers.Projection("EPSG:900913"),
			displayProjection: new OpenLayers.Projection("EPSG:4326"),
			units:"m",
			maxResolution:78271.516953125,
			numZoomLevels:4,
			layerContainerOrigin:new OpenLayers.LonLat(-180, 0),
			maxExtent:new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34),
			restrictedExtent:new OpenLayers.Bounds(-20037508.34, -10018754, 20037508.34, 20037508.34),
			controls:[]
		});
		var base = new OpenLayers.Layer("", {isBaseLayer: true});
		map.addLayer(base);
		return map;
	}

	/**
	* Creates a choropleth stylemap to define the map shading colors.
	*/
	function createStyles() {
		var theme = new OpenLayers.Style();
		
		range5 = new OpenLayers.Rule({
				filter:new OpenLayers.Filter.Comparison({
				type:OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
				property:"value",
				value:80
			}),
			symbolizer:{Polygon:{fillColor:'#003060'}}
		});
		
		range4 = new OpenLayers.Rule({
			filter: new OpenLayers.Filter.Logical({
				type: OpenLayers.Filter.Logical.AND,
				filters:[ 
					new OpenLayers.Filter.Comparison({
					  type:OpenLayers.Filter.Comparison.LESS_THAN,
					  property:"value",
					  value:80
					}),
					new OpenLayers.Filter.Comparison({
					  type:OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
					  property:"value",
					  value:60
					})
				]
			}),
			symbolizer: {Polygon:{fillColor:'#00719f'}}
		});
		
		range3 = new OpenLayers.Rule({
			filter: new OpenLayers.Filter.Logical({
				type: OpenLayers.Filter.Logical.AND,
				filters:[ 
					new OpenLayers.Filter.Comparison({
					  type:OpenLayers.Filter.Comparison.LESS_THAN,
					  property:"value",
					  value:60
					}),
					new OpenLayers.Filter.Comparison({
					  type:OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
					  property:"value",
					  value:40
					})
				]
			}),
			symbolizer: {Polygon:{fillColor:'#00a9df'}}
		});
		
		range2 = new OpenLayers.Rule({
			filter: new OpenLayers.Filter.Logical({
				type: OpenLayers.Filter.Logical.AND,
				filters:[ 
					new OpenLayers.Filter.Comparison({
					  type:OpenLayers.Filter.Comparison.LESS_THAN,
					  property:"value",
					  value:40
					}),
					new OpenLayers.Filter.Comparison({
					  type:OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
					  property:"value",
					  value:20
					})
				]
			}),
			symbolizer: {Polygon:{fillColor:'#68c2e7'}}
		});
		
		range1 = new OpenLayers.Rule({
			filter: new OpenLayers.Filter.Comparison({
				type:OpenLayers.Filter.Comparison.LESS_THAN,
				property:"value",
				value:20
			}),
			symbolizer:{Polygon:{fillColor:'#aed0da'}}
		});
		
		range0 = new OpenLayers.Rule({
			filter: new OpenLayers.Filter.Comparison({
				type:OpenLayers.Filter.Comparison.EQUAL_TO,
				property:"value",
				value:"No Data"
			}),
			symbolizer:{Polygon:{fillColor:'#cccccc'}}
		});
		
		theme.addRules([range1, range2, range3, range4, range5, range0]);

		return new OpenLayers.StyleMap({'default':theme});
	}

	/**
	* Attaches the tooltip to a given map layer.
	*/
	function attachTooltip(map, layer) {
		var selector = new OpenLayers.Control.SelectFeature(layer, {
			hover:true,
			multiple:false,
			onSelect:function(feature) {
				tooltip.show('<h4>'+ feature.attributes.name + "</h4> "+ feature.attributes.value);
			},
			onUnselect:function(feature) {
				tooltip.hide();
			}
		});
		map.addControl(selector);
		
		// override highlight methods to prevent color change.
		selector.highlight = function(feature){};
		selector.unhighlight = function(feature){};
		selector.handlers.feature.stopDown = false;
		selector.activate();
	}

	return {
		/**
		* Initializes a page container as the primary map display.
		*/
		init:function(target, datafile) {
			map = createMap(target);
			mapStyles = createStyles();
			tooltip = new MapTooltip(target);

			// Configure default styles.
			OpenLayers.Feature.Vector.style['default']['fillColor'] = "#cccccc";
			OpenLayers.Feature.Vector.style['default']['fillOpacity'] = 0.9;
			OpenLayers.Feature.Vector.style['default']['strokeColor'] = "#000000";
			OpenLayers.Feature.Vector.style['default']['strokeOpacity'] = 0.1;
			OpenLayers.Feature.Vector.style['default']['stroke'] = true;
			
			mapShapes = new OpenLayers.Layer.GML("Interactive Shapes", datafile, {
				format:OpenLayers.Format.GeoJSON, 
				styleMap:mapStyles, 
				isBaseLayer:false, 
				projection:new OpenLayers.Projection("EPSG:4326"),
				renderers:["SVG", "VML", "Canvas"]
			});
			map.addLayer(mapShapes);
			map.addControl(new OpenLayers.Control.MouseDefaults());
			map.addControl(new OpenLayers.Control.PanZoomBar());
			attachTooltip(map, mapShapes);
			map.zoomToMaxExtent();
		},
		
		/**
		* Repaints the map with new values.
		*/
		repaint:function(){
			for (var i in mapShapes.features) {
				var val = Math.floor(100 * Math.random());
				mapShapes.features[i].attributes.value = (val < 10) ? "No Data" : val;
			}
			mapShapes.redraw();
		},

		/**
		* Recalibrates the style map with new ranges.
		*/
		recalibrate:function(){
			var breaks = [
				[20, 40, 60, 80],
				[10, 30, 50, 70],
				[25, 45, 70, 85]
			];
			breaks = breaks[(breaksIndex+=1) % (breaks.length-1)];
			range5.filter.value = breaks[3];
			range4.filter.filters[0].value = breaks[3];
			range4.filter.filters[1].value = breaks[2];
			range3.filter.filters[0].value = breaks[2];
			range3.filter.filters[1].value = breaks[1];
			range2.filter.filters[0].value = breaks[1];
			range2.filter.filters[1].value = breaks[0];
			range1.filter.value = breaks[0];
			mapShapes.redraw();
		}
	};
})();