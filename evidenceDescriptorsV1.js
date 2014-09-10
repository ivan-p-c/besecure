//=======GLOBAL VARIABLES=======
		   
		   var geo_layer,polygonLayer;
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
					}
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
					}
				});
				
				
				//Adding layers
				//map.addLayer(asb2012_layer);
				map.addLayer(polygonLayer);
				map.addLayer(geo_layer);
			
				map.addControl(navigate);
				//Adding a Layer Switch controller
				map.addControl(new OpenLayers.Control.LayerSwitcher());
				
/* 				drawControls = {polygon: new OpenLayers.Control.DrawFeature(polygonLayer,
                        OpenLayers.Handler.Polygon)};
				for(var key in drawControls) {
                    map.addControl(drawControls[key]);
                } */
				
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
				 
				panel.addControls([navigate, save, del, edit, draw]);
				panel.defaultControl = draw;
				map.addControl(panel);
				
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
	
	
	function saveSelection(){
		var request = OpenLayers.Request.GET({
		url: "http://localhost:8080/geoserver/rest/workspaces/cite/featuretypes.xml",
		callback: function(request) {
			// Code here to handle the response, the request object contains the data
			
			//Save selection in a database table, including a timestamp
			
			//IMPORTANT: Initial testing code deleted: ASK ITTI (Tomasz and Marek) how to save selection and what method to use (Java? JQuery?) since plain Javascript is highly insecure
			//...
			//document.getElementById("output-id2").innerHTML = request.responseText;
			alert("Still not saving anything in the DB (will do soon)");
		}
	});
	}
	
	
	function removeOptions(selectbox)
	{
		var i;
		for(i=selectbox.options.length-1;i>=0;i--)
		{
			selectbox.remove(i);
		}
	}
            