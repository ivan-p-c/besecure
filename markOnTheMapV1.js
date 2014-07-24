var geo_layer,wms_layer;
		   var map;
		   var defaultZoom = 14;
		   

           function init(){
			    //local variables with SRS projections: mercator for base map and WGS84 for additional layers
			    var geographic = new OpenLayers.Projection("EPSG:4326");
			    var mercator = new OpenLayers.Projection("EPSG:900913");
			   
			    //map object constructor
			    map = new OpenLayers.Map('map', {projection: mercator});
			    
				//adding the base layer (OSM: Open Service Maps) to the map
			    osmLayer  = new OpenLayers.Layer.OSM();
				
				//create a style object
				var style = new OpenLayers.Style();
				var select_style = new OpenLayers.Style();
				//rule used for all polygons
				var rule_fsa = new OpenLayers.Rule({
					symbolizer: {
					fillColor: "#ff9a9a",
					fillOpacity: 0.5,
					strokeColor: "#000000",
					strokeWidth: 1,
					strokeDashstyle: "dash",
					label: "${name}",
					labelAlign: "cc",
					fontColor: "#333333",
					fontOpacity: 0.9,
					fontFamily: "Arial",
					fontSize: 14}
				});
				var rule_highlight = new OpenLayers.Rule({
					/*filter: new OpenLayers.Filter.Comparison({
					type: OpenLayers.Filter.Comparison.EQUAL_TO,
					property: "name",
					value: "BOTANIC",
				}),*/
				symbolizer: {
					fillColor: "#FF7144",
					fillOpacity: 0.6,
					strokeColor: "#FF0000",
					strokeWidth: 2,
					strokeDashstyle: "solid",
					label: " ${name}",
					labelAlign: "cc",
					fontColor: "#000000",
					fontOpacity: 1,
					fontFamily: "Arial",
					fontSize: 16,
					fontWeight: "600"}
				});
				style.addRules([rule_fsa]);
				select_style.addRules([rule_highlight]);
				var styles = new OpenLayers.StyleMap({'default': style,'select': select_style});
				
				
				map.addLayer(osmLayer);
				
				//Defining vector layer from Geoserver
				 /*wms_layer = new OpenLayers.Layer.WMS
					(
					"Northern Ireland Wards",
					"http://localhost:8080/geoserver/wms",
					{layers: 'cite:osni_ward93', transparent:true, format: 'image/png'}, {isBaseLayer: false, opacity: 0.5}
					); */
				
				//WFS LAYER definition
				geo_layer = new OpenLayers.Layer.Vector("Wards", {
					strategies: [new OpenLayers.Strategy.BBOX()],
					styleMap: styles,
					projection: new OpenLayers.Projection("EPSG:4326"),
					protocol: new OpenLayers.Protocol.WFS({          
					version: "1.1.0",
					url: "http://localhost:8080/geoserver/wfs?service=wfs&version=1.1.0&request=GetFeature&typeNames=cite:osni_ward93&propertyName=area",            
					featurePrefix: "cite",
					featureType: "osni_ward93",
					featureNS: "http://www.opengeospatial.net/cite",
					outputFormat: "application/json",
					readFormat: new OpenLayers.Format.GeoJSON(),
					geometryName: "geom"
					})
				});

				//Positioning and zooming map
                map.setCenter(new OpenLayers.LonLat(-5.92, 54.59).transform(geographic,mercator), defaultZoom);
				//Adding navigating controller
				var navigate = new OpenLayers.Control.Navigation({
					dragPanOptions: {
						enableKinetic: true,
						documentDrag: true
					}
				});
				map.addControl(navigate);
				//Adding a Layer Switch controller
				map.addControl(new OpenLayers.Control.LayerSwitcher());

				//Select feature
				var selectItem = new OpenLayers.Control.SelectFeature(
					geo_layer, 
					{toggle: true, clickout:true}
				);
				selectItem.handlers['feature'].stopDown = false;
				selectItem.handlers['feature'].stopUp = false;
				map.addControl(selectItem);
				selectItem.activate();
				
				geo_layer.events.fallThrough = true;
				geo_layer.setZIndex(1);
				
				geo_layer.events.on(
					{
						featureselected: function(event)
						{
						var feature = event.feature;
						var id = feature.geometry.id;
						var area = feature.geometry.getGeodesicArea()/1000000;
						var abs = feature.attributes.asb2006;
						var name = feature.attributes.name;
						var bur = feature.attributes.burglar_10;
						var vehicle = feature.attributes.vehicle_10;
						var output = "Ward: " + name + "</br>Area: " + area.toFixed(2) + "</br> Anti-social behaviour events [2006]: " + abs + "</br>Burglary incidents [2006]: " + bur + 			"</br>Vechicle crime incidents [2006]: " + vehicle;
						document.getElementById("output-id").innerHTML = output;

						//====================================================
						var output;

						for (var key in feature.attributes) {
							if (feature.attributes.hasOwnProperty(key)) {
							output =  output + key + " = " + Math.round(feature.attributes[key],2) + "</br>";
							}
						}
						//document.getElementById("output-id").innerHTML = output;
						//====================================================
					}
				});
				
				
				//Adding layers
				map.addLayer(geo_layer);
				//map.addLayer(wms_layer);
			
	}
            