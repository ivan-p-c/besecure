//=======GLOBAL VARIABLES=======
		   
		   var geo_layer,polygonLayer,circleLayer;
		   var htmlSelect;
		   var map;
		   var drawControls;
		   var selectItem;
		   //WARNING: The lower the zoom value, the wider area visualized, but the longer layers take to be loaded
		   var defaultZoom = 14;
		   

			
			//set up the modification tools
			var DeleteFeature = OpenLayers.Class(OpenLayers.Control, {
			initialize: function(layer, options) {
			OpenLayers.Control.prototype.initialize.apply(this, [options]);
			this.layer = layer;
			this.handler = new OpenLayers.Handler.Feature(
			this, layer, {click: this.clickFeature}
			);
			},
			clickFeature: function(feature) {
			// if feature doesn't have a fid, destroy it
			if(feature.fid == undefined) {
			this.layer.destroyFeatures([feature]);
			} else {
			feature.state = OpenLayers.State.DELETE;
			this.layer.events.triggerEvent("afterfeaturemodified",
			{feature: feature});
			feature.renderIntent = "select";
			this.layer.drawFeature(feature);
			}
			},
			setMap: function(map) {
			this.handler.setMap(map);
			OpenLayers.Control.prototype.setMap.apply(this, arguments);
			},
			CLASS_NAME: "OpenLayers.Control.DeleteFeature"
			});
		
		function showSuccessMsg(){
			showMsg("Transaction successfully completed");
		};
 
		function showFailureMsg(){
			showMsg("An error occured while operating the transaction");
		};
		
//=======INITIALIZING FUNCTION=======

           function init(){
			    //local variables with SRS projections: mercator for base map and WGS84 for additional layers
			    var geographic = new OpenLayers.Projection("EPSG:4326");
			    var mercator = new OpenLayers.Projection("EPSG:900913");
				

			   
			    //map object constructor
			    //map = new OpenLayers.Map('map', {projection: mercator});
			    
				var map = new OpenLayers.Map ("map", {   
					controls:[
						//allows the user pan ability
						new OpenLayers.Control.Navigation(),
						//displays the pan/zoom tools                   
						new OpenLayers.Control.PanZoom(),
						//displays a layer switcher
						new OpenLayers.Control.LayerSwitcher(),   
						//displays the mouse position's coordinates in a
						//<div> html element with id="coordinates"
						new OpenLayers.Control.MousePosition(
						{div:document.getElementById("coordinates")})   
						],
						//projection: WGS84_google_mercator,
						displayProjection: geographic
				} );
				
				//adding the base layer (OSM: Open Service Maps) to the map
			    osmLayer  = new OpenLayers.Layer.OSM();
				
				//LAYER THAT WILL CONTAIN THE POLYGON(S) DRAWN BY THE USER
				//polygonLayer = new OpenLayers.Layer.Vector("Custom Areas");
				
				var saveStrategy = new OpenLayers.Strategy.Save({auto:true});
				saveStrategy.events.register("success", '', showSuccessMsg);
				saveStrategy.events.register("failure", '', showFailureMsg);
				
				polygonLayer = new OpenLayers.Layer.Vector("Custom Areas", {
					visibility: false,
					strategies: [
					new OpenLayers.Strategy.BBOX(), 
					saveStrategy
					],
					protocol: new OpenLayers.Protocol.WFS({
						url: "http://localhost:8080/geoserver/wfs",
						featurePrefix:"cite",
						featureType: "custom_areas",
						featureNS: "http://www.opengeospatial.net/cite",
						srsName: "EPSG:4326",
						geometryName: "geom",
						version: "1.1.0"
					})
				});
				
				
				
				
/* 				// ####################  Create the Circle/Radius layer
				var radiusLayer = new OpenLayers.Layer.Vector("Radius Layer", {visibility: false });
				
				// Extend the default style so that we can dynamically calculate
				// the circle radius
				var style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style.default);
 
				// By using a function for the radius style, the
				// radius will update during zoom level changes
				OpenLayers.Util.extend( style, { pointRadius: '${calculateRadius}' } );
 
				// Our function to recalculate the radius after zoom change
				var styleArea = new OpenLayers.Style(
					style,
					{
					context: {
						calculateRadius: function(feature) {
						return feature.attributes.radius / feature.layer.map.getResolution();
						}
					}
				}
				);
				
								// Create a new OpenLayers StyleMap
				var sm = new OpenLayers.StyleMap({
					'default': styleArea
				});
				
				// Create the circle layer, and add our custom StyleMap
				var circleLayer = new OpenLayers.Layer.Vector('Circle Layer', { styleMap: sm });
				//################################ */
				
				
				
				var circleLayer = new OpenLayers.Layer.Vector("Circles", {
					visibility: false,
					strategies: [
					new OpenLayers.Strategy.BBOX(), 
					saveStrategy
					],
					protocol: new OpenLayers.Protocol.WFS({
						url: "http://localhost:8080/geoserver/wfs",
						featurePrefix:"cite",
						featureType: "circular_areas",
						featureNS: "http://www.opengeospatial.net/cite",
						srsName: "EPSG:4326",
						geometryName: "geom",
						version: "1.1.0"
					})
				});
				
				map.addLayer(circleLayer);
			
				
				
				//create a style object
				var style = new OpenLayers.Style();
				var select_style = new OpenLayers.Style();
				//rule used for all polygons
				var rule_fsa = new OpenLayers.Rule({
					symbolizer: {
					fillColor: "#5a5aff",
					fillOpacity: 0.2,
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
				
				//Adding base OSM layer to the map
				map.addLayer(osmLayer);

				
				
				
				
				
/* 				//######################
					radiusLayer.events.register('featureadded', map, featureAdded);
					 
					function featureAdded( event ) {
					 
					  // Get the centre xy
					  var widthOffset = (event.feature.geometry.bounds.right - event.feature.geometry.bounds.left) / 2;
					  var centreX = event.feature.geometry.bounds.left + widthOffset;
					 
					  var heightOffset = (event.feature.geometry.bounds.top - event.feature.geometry.bounds.bottom) / 2;
					  var centreY = event.feature.geometry.bounds.bottom + heightOffset;
					 
					  // Create the point geometry
					  var pointGeometry = new OpenLayers.Geometry.Point(centreX, centreY);
					 
					  // Get the width of the bounding box in pixels
					  var pixelLeft = map.getPixelFromLonLat(
						new OpenLayers.LonLat(
						  event.feature.geometry.bounds.left,
						  event.feature.geometry.bounds.top
						)
					  );
					 
					  var pixelRight = map.getPixelFromLonLat(
						new OpenLayers.LonLat(
						  event.feature.geometry.bounds.right,
						  event.feature.geometry.bounds.top
						)
					  );
					 
					  // Divide width in two, as we need the radius, not diameter
					  var width = (pixelRight.x - pixelLeft.x) / 2;
					 
					  // Create the point (circle) feature and add it to the circle layer.
					  // The radius needs to be in meters, so we multiple it by the
					  // map resolution to provide the correct value
					  var pointFeature = new OpenLayers.Feature.Vector(pointGeometry, {radius: width * map.getResolution()});
					 
					  circleLayer.addFeatures([pointFeature]);
					 
					  // Clean up the vector draw path layer
					  radiusLayer.removeFeatures( vectorLayer.features, {silent: true} );
					}
					 
					var drawOptions = {
						handlerOptions: {
							freehand: true
						}
					};
					 
					var drawControl = new OpenLayers.Control.DrawFeature( radiusLayer, OpenLayers.Handler.Path, drawOptions );
					map.addControl( drawControl );
					drawControl.activate();
				//###################### */
				
				
				
				
				
				
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
				
				//Geometrical points sample layer, with ASB data from Belfast in 2012 (ONLY FOR TESTING PURPOSES)
				asb2012_layer = new OpenLayers.Layer.WMS
					(
					"ASB",
					"http://localhost:8080/geoserver/wms",
					{layers: 'cite:psni_data', transparent:true, format: 'image/png'}, {isBaseLayer: false, opacity: 1}
					); 

				
				//Positioning and zooming map
                map.setCenter(new OpenLayers.LonLat(-5.92, 54.59).transform(geographic,mercator), defaultZoom);
				//Adding navigating controller
				var navigate = new OpenLayers.Control.Navigation({
					dragPanOptions: {
						enableKinetic: true,
						documentDrag: true
					},
					displayClass: "olControlNavigation"
				});
				map.addControl(navigate);
				//Adding a Layer Switch controller
				map.addControl(new OpenLayers.Control.LayerSwitcher());

				
				//Select feature(s) in the selected area (e.g. ward) --> FOR TESTING PURPOSES
				selectItem = new OpenLayers.Control.SelectFeature(
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
						var name = feature.attributes.name;
						var id = feature.attributes.ward93_id;
						/*var abs = feature.attributes.asb2006;
						var bur = feature.attributes.burglar_10;
						var vehicle = feature.attributes.vehicle_10;*/
						var output = "Ward: " + name + " (id: "+id+")</br>Area: " + area.toFixed(2) + " m2";
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
						htmlSelect=document.getElementById('selectAttribute');
						
						removeOptions(htmlSelect);
						
						for (var key in geo_layer.features[1].attributes) {
							if (geo_layer.features[0].attributes.hasOwnProperty(key)) {
								selectBoxOption = document.createElement("option");
								selectBoxOption.value = key;
								selectBoxOption.text = key; 
								htmlSelect.add(selectBoxOption, null); 
							}
						}
						
						//Enable selector of data tables associated to the area selected
						htmlSelectTables = document.getElementById('selectTables');
						removeOptions(htmlSelectTables);
						
						showDataTables(htmlSelectTables);
					}
				});
				
				
				//Adding layers
				map.addLayer(asb2012_layer);
				map.addLayer(polygonLayer);
				map.addLayer(geo_layer);
			
				map.addControl(navigate);
				//Adding a Layer Switch controller
				map.addControl(new OpenLayers.Control.LayerSwitcher());
				
				
				// add the custom editing toolbar
				var panel = new OpenLayers.Control.Panel(
					{'displayClass': 'olControlEditingToolbar'}
				);
				 
				var navigate = new OpenLayers.Control.Navigation({
					title: "Pan Map"
				});
				 
				var draw = new OpenLayers.Control.DrawFeature(
					polygonLayer, OpenLayers.Handler.Polygon,
					{
						title: "Draw Feature",
						displayClass: "olControlDrawFeaturePolygon",
						multi: true
					}
				);
				
				polyOptions = {sides: 40};
				var circleControl = new OpenLayers.Control.DrawFeature(polygonLayer,
                                            OpenLayers.Handler.RegularPolygon,
                                            {title: "Draw Circle", handlerOptions: polyOptions});
				//map.addControl(circleControl);
				 
				var edit = new OpenLayers.Control.ModifyFeature(polygonLayer, {
					title: "Modify Feature",
					displayClass: "olControlModifyFeature"
				});
				 
				var del = new DeleteFeature(polygonLayer, {title: "Delete Feature"});
				 
				var save = new OpenLayers.Control.Button({
					title: "Save Changes",
					trigger: function() {
						if(edit.feature) {
						edit.selectControl.unselectAll();
						}
					saveStrategy.save();
					 alert('saved');
					},
						displayClass: "olControlSaveFeatures"
				});
				 
				panel.addControls([navigate, save, del, edit, draw, circleControl]);
				panel.defaultControl = navigate;
				map.addControl(panel);
				
				
				//DISABLE DRAGGING
				for (var i = 0; i< map.controls.length; i++) {
					if (map.controls[i].displayClass == 
											"olControlNavigation") {
						map.controls[i].deactivate();
					}
				}
				
	}
	
	function showDataTables(htmlSelectTables){
				//WMS LAYER definition
				data_layer = new OpenLayers.Layer.Vector("Data", {
					strategies: [new OpenLayers.Strategy.BBOX()],
					projection: new OpenLayers.Projection("EPSG:4326"),
					protocol: new OpenLayers.Protocol.WFS({          
					version: "1.1.0",
					url: "http://localhost:8080/geoserver/wfs?service=wfs&version=1.1.0&request=GetFeature&typeNames=cite:tables_list&propertyName=name_shown",            
					featurePrefix: "cite",
					featureType: "tables_list",
					featureNS: "http://www.opengeospatial.net/cite",
					outputFormat: "application/json",
					//geometryName: "geom",
					readFormat: new OpenLayers.Format.GeoJSON()
					})
				});
					
				for (var key in data_layer.features[1].attributes) {
							if (data_layer.features[0].attributes.hasOwnProperty(key)) {
								selectBoxOption = document.createElement("option");
								selectBoxOption.value = key;
								selectBoxOption.text = key; 
								htmlSelectTables.add(selectBoxOption, null); 
							}
				}
	}
	
	function toggleControl(element) {
                for(key in drawControls) {
                    var control = drawControls[key];
                    if(element.value == key && element.checked) {
                        control.activate();
						polygonLayer.setVisibility(true);
						removeOptions(htmlSelect);
						selectItem.unselectAll();
						document.getElementById("output-id").innerHTML = "";
                    } else {
                        control.deactivate();
						polygonLayer.setVisibility(false);
                    }
                }
            }

	function allowPan(element) {
		var stop = !element.checked;
		for(var key in drawControls) {
			drawControls[key].handler.stopDown = stop;
			drawControls[key].handler.stopUp = stop;
			}
		}
	
	
	function removeOptions(selectbox)
	{
		var i;
		for(i=selectbox.options.length-1;i>=0;i--)
		{
			selectbox.remove(i);
		}
	}
            