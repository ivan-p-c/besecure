//=======GLOBAL VARIABLES=======
		   
		   var geo_layer,polygonLayer,circleLayer;
		   var htmlSelect;
		   var selectedCircleFeature;
		   var map;
		   var drawControls;
		   var selectItem;
		   var area_name;
		   var tooltip;
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
			    
				map = new OpenLayers.Map ("map", {   
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
					visibility: true,
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
						//Enable selector of data categories associated to the area selected (excluding geometries)
						htmlSelectCateg = document.getElementById('selectCateg');
						htmlSelectCateg.disabled = false;
						removeOptions(htmlSelectCateg);	

						htmlSelectYear = document.getElementById('selectYear');
						htmlSelectYear.disabled = true;
						removeOptions(htmlSelectYear);
						htmlSelectAttr = document.getElementById('selectAttrib');
						htmlSelectAttr.disabled = true;
						removeOptions(htmlSelectAttr);
						htmlSelectTables = document.getElementById('selectTables');
						htmlSelectTables.disabled = true;
						removeOptions(htmlSelectTables);
						
						jQuery.post("http://localhost:80/get_data_categories.php", {}, function(data) {
								//data_categories.innerHTML = data_categories.innerHTML + data;
								jsonData = JSON.parse(data);
								for (var i = 0; i < jsonData.length; i++) {
									name = jsonData[i].name;
									selectBoxOption = document.createElement("option");
									selectBoxOption.value = name;
									selectBoxOption.text = name; 
									htmlSelectCateg.add(selectBoxOption, null); 
								}
								htmlSelectCateg.selectedIndex = -1;
						});
								
						var feature = event.feature;
						var id = feature.geometry.id;
						var area = feature.geometry.getGeodesicArea()/1000000;
						area_name = feature.attributes.name;
						var ward_id = feature.attributes.ward93_id;

						//var output = "Ward: " + name + " (id: "+id+")</br>Area: " + area.toFixed(2) + " m2";
						var output = "Ward: " + area_name;
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
						
						
						
/* 						removeOptions(htmlSelect);
						
						for (var key in geo_layer.features[1].attributes) {
							if (geo_layer.features[0].attributes.hasOwnProperty(key)) {
								selectBoxOption = document.createElement("option");
								selectBoxOption.value = key;
								selectBoxOption.text = key; 
								htmlSelect.add(selectBoxOption, null); 
							}
						} */
						
						
						//showDataTables(htmlSelectTables);
					}
				});
				
				
				
				//Select feature(s) in the custom area (e.g. polygon or circle)
				selectCustom = new OpenLayers.Control.SelectFeature(
					polygonLayer, 
					{toggle: true, clickout:true}
				);
				selectCustom.handlers['feature'].stopDown = false;
				selectCustom.handlers['feature'].stopUp = false;
				map.addControl(selectCustom);
				selectCustom.activate();
				
				polygonLayer.events.fallThrough = true;
				polygonLayer.setZIndex(1);
				
				polygonLayer.events.on(
				{
					featureselected: function(event)
					{
						selectedCircleFeature = event.feature;
						
						document.getElementById("output-id").innerHTML = 
						"<b>Resize circular area:</b><input type=\"button\" value='+'"+
						"onClick=\"resizeCirclePlus();\" />" +
						"<input type=\"button\" value='-'"+
						"onClick=\"resizeCircleMinus();\" />";
						
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
					title: "Pan Map / Select Custom Areas"
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
	
	
	
	function activateTablesList(){
		htmlSelectCateg = document.getElementById('selectCateg');
		category_selected = htmlSelectCateg.options[htmlSelectCateg.selectedIndex].text;

		htmlSelectYear = document.getElementById('selectYear');
		htmlSelectYear.disabled = true;
		removeOptions(htmlSelectYear);
		htmlSelectAttr = document.getElementById('selectAttrib');
		htmlSelectAttr.disabled = true;
		removeOptions(htmlSelectAttr);
		
		//Enable selector of data tables associated to the category selected (excluding geometries)
		htmlSelectTables = document.getElementById('selectTables');
		htmlSelectTables.disabled = false;
		removeOptions(htmlSelectTables);						
		jQuery.post("http://localhost:80/get_data_tables.php", {category: category_selected}, function(data) {
				jsonData = JSON.parse(data);
				for (var i = 0; i < jsonData.length; i++) {
					cname = jsonData[i].name_shown;
					value = jsonData[i].tablename;
					selectBoxOption = document.createElement("option");
					selectBoxOption.value = value;
					selectBoxOption.text = cname; 
					htmlSelectTables.add(selectBoxOption, null); 
				}
				htmlSelectTables.selectedIndex = -1;
		});
	}
	
	
	function activateYearSelector(){
		htmlSelectAttr = document.getElementById('selectAttrib');
		htmlSelectAttr.disabled = true;
		removeOptions(htmlSelectAttr);
	
		htmlSelectTables = document.getElementById('selectTables');
		table_selected = htmlSelectTables.options[htmlSelectTables.selectedIndex].value;
		table_selected = String(table_selected);
		
		jQuery.post("http://localhost:80/get_all_attrib_data.php", {table: table_selected, area: area_name}, function(data) {
				jsonData = JSON.parse(data);
				table_content = "<table border=\"1\"><thead><tr><td><b>Descriptor name</b></td>" + 
				"<td><b>Descriptor value</b></td></tr></thead><tbody>";
				$.each(jsonData, function(k, v) {
					if($.inArray(k,["ward","ward_code","lgd","lgd_code"]) == -1){
					//display the key and value pair
					table_content = table_content.concat("<tr><td><b>"+ k.replace(/_/g," ") + "</b></td><td>"+ v +"</td></tr>");
					}
				});
				table_content = table_content.concat("</tbody></table>");
				htmlResult = document.getElementById("data_shown");
				htmlResult.innerHTML = table_content;
		});
		
		jQuery.post("http://localhost:80/check_table_years.php", {table: table_selected}, function(data) {
				jsonData = JSON.parse(data);
				is_per_year = jsonData.per_year;
				//Operations for a table with data for multiple years
				if(is_per_year == "t"){
					htmlSelectYear = document.getElementById('selectYear');
					htmlSelectYear.disabled = false;
					removeOptions(htmlSelectYear);
					jQuery.post("http://localhost:80/get_table_years.php", {table: table_selected}, function(yeardata) {
						jsonYearData = JSON.parse(yeardata);
						yearArray = new Array();
						for (var i = 0; i < jsonYearData.length; i++) {
							cname = jsonYearData[i].column_name;
							if(cname[0]=='_'){
								cname = cname.substring(1,5);
								if($.inArray(cname, yearArray) == -1){
									yearArray.push(cname);
								}
							}
						}
						for (var j = 0; j < yearArray.length; j++) {
							selectBoxOption = document.createElement("option");
							selectBoxOption.value = yearArray[j];
							selectBoxOption.text = yearArray[j];
							htmlSelectYear.add(selectBoxOption, null);
						};
						htmlSelectYear.selectedIndex = -1;
					});
				//Operations for a table with data not separated by years
				} else{
					htmlSelectYear = document.getElementById('selectYear');
					htmlSelectYear.disabled = true;
					removeOptions(htmlSelectYear);
					selectBoxOption = document.createElement("option");
					selectBoxOption.value = "N/A";
					selectBoxOption.text = "N/A";
					htmlSelectYear.add(selectBoxOption, null);
					activateAttributesList();
				}
		});
	}
	
	function activateAttributesList(){
		htmlSelectYear = document.getElementById('selectYear');
		year_selected = htmlSelectYear.options[htmlSelectYear.selectedIndex].text;
		htmlSelectTables = document.getElementById('selectTables');
		table_selected = htmlSelectTables.options[htmlSelectTables.selectedIndex].value;
		table_selected = String(table_selected);
		htmlSelectAttr = document.getElementById('selectAttrib');
		htmlSelectAttr.disabled = false;
		removeOptions(htmlSelectAttr);
		jQuery.post("http://localhost:80/get_table_attributes.php", {year: year_selected, table: table_selected}, function(data) {
			jsonData = JSON.parse(data);
			for (var i = 0; i < jsonData.length; i++) {
				cname = jsonData[i].column_name;
				value = jsonData[i].column_name;
				if($.inArray(cname,["ward","ward_code","lgd","lgd_code"]) == -1){
					cname = cname.replace(/_/g," ");
					selectBoxOption = document.createElement("option");
					selectBoxOption.value = value;
					selectBoxOption.text = cname; 
					htmlSelectAttr.add(selectBoxOption, null);
				}
			}
			htmlSelectAttr.selectedIndex = -1;
		});
	}
	
	
	function showDataForAttribute(){
		htmlSelectTables = document.getElementById('selectTables');
		table_selected = htmlSelectTables.options[htmlSelectTables.selectedIndex].value;
		table_selected = String(table_selected);
		htmlSelectAttr = document.getElementById('selectAttrib');
		attr_selected = htmlSelectAttr.options[htmlSelectAttr.selectedIndex].value;
		attr_selected = String(attr_selected);
		
		jQuery.post("http://localhost:80/get_simple_data.php",
		{attr: attr_selected, table: table_selected, area: area_name}, function(data) {
			htmlResult = document.getElementById("data_shown");
			htmlResult.innerHTML = "<table border=\"1\"><thead><tr><td><b>Descriptor name</b></td>" + 
			"<td><b>Descriptor value</b></td></tr></thead>" +
			"<tbody>" +
			"<tr><td><b>"+ htmlSelectAttr.options[htmlSelectAttr.selectedIndex].text +
			"</b></td><td>"+ data +"</td></tr></tbody>" +
			"</table>";
		});
		
		choropleth();	
	}

	
	function resizeCirclePlus() {
            centroid = selectedCircleFeature.geometry.getCentroid();
			selectedCircleFeature.geometry.resize(1.2,centroid);
			polygonLayer.redraw();
        }
	
	function resizeCircleMinus() {
            centroid = selectedCircleFeature.geometry.getCentroid();
			selectedCircleFeature.geometry.resize(1.0 / 1.2,centroid);
			polygonLayer.redraw();
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
	
	/**
	* Creation of a new layer with a choropleth map that shows descriptor data
	*/
	function choropleth(){
		choroplethStyles = createStyles();
		//tooltip = new MapTooltip("BESECURE");
		
		// Configure default styles.
		OpenLayers.Feature.Vector.style['default']['fillColor'] = "#cccccc";
		OpenLayers.Feature.Vector.style['default']['fillOpacity'] = 0.9;
		OpenLayers.Feature.Vector.style['default']['strokeColor'] = "#000000";
		OpenLayers.Feature.Vector.style['default']['strokeOpacity'] = 0.1;
		OpenLayers.Feature.Vector.style['default']['stroke'] = true;
		
/* 		mapShapes = new OpenLayers.Layer.GML("Interactive Shapes", datafile, {
			format:OpenLayers.Format.GeoJSON, 
			styleMap:choroplethStyles, 
			isBaseLayer:false, 
			projection:new OpenLayers.Projection("EPSG:4326"),
			renderers:["SVG", "VML", "Canvas"]
		}); */
		choro_layer = new OpenLayers.Layer.Vector("Choropleth Map", {
			strategies: [new OpenLayers.Strategy.BBOX()],
			styleMap: choroplethStyles,
			isBaseLayer:false,
			projection: new OpenLayers.Projection("EPSG:4326"),
			protocol: new OpenLayers.Protocol.WFS({          
			version: "1.1.0",
			url: "http://localhost:8080/geoserver/wfs?service=wfs&version=1.1.0&request=GetFeature&typeNames=cite:view_ni&propertyName=ward93_id",            
			featurePrefix: "cite",
			featureType: "view_ni",
			featureNS: "http://www.opengeospatial.net/cite",
			outputFormat: "application/json",
			readFormat: new OpenLayers.Format.GeoJSON(),
			geometryName: "geom"
			})
		});
		map.addLayer(choro_layer);
		//attachTooltip(map, choro_layer);
		var highlightControl = new OpenLayers.Control.SelectFeature(choro_layer, {
			hover: true,
			highlightOnly: true,
			renderIntent: "temporary"
		});
		map.addControl(highlightControl);
		highlightControl.activate();
				
		highlightControl.events.on({
			featurehighlighted: function(evt) {

				var lonlat = new OpenLayers.LonLat(
					evt.feature.geometry.x,
					evt.feature.geometry.y
				);

				var html = 'Name: ' +
						   evt.feature.attributes.name + '<br />' +
						   'Score: ' + 
						   evt.feature.attributes.score;

				var popup = new OpenLayers.Popup.Anchored(
					'myPopup',
					lonlat,
					new OpenLayers.Size(150, 60),
					html, 
					{size: {w: 14, h: 14}, offset: {x: -7, y: -7}},
					false
				);

				evt.feature.popup = popup;
				map.addPopup(popup);
			},
			featureunhighlighted: function(evt) {
				map.removePopup(evt.feature.popup);
			}
		});
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
	
	
	/**
	* Creates a choropleth stylemap to define the map shading colors.
	*/
	function createStyles() {
		var theme = new OpenLayers.Style();
		
		range5 = new OpenLayers.Rule({
				filter:new OpenLayers.Filter.Comparison({
				type:OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
				property:"ward93_id",
				value:200
			}),
			symbolizer:{Polygon:{fillColor:'#003060'}}
		});
		
		range4 = new OpenLayers.Rule({
			filter: new OpenLayers.Filter.Logical({
				type: OpenLayers.Filter.Logical.AND,
				filters:[ 
					new OpenLayers.Filter.Comparison({
					  type:OpenLayers.Filter.Comparison.LESS_THAN,
					  property:"ward93_id",
					  value:200
					}),
					new OpenLayers.Filter.Comparison({
					  type:OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
					  property:"ward93_id",
					  value:100
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
					  property:"ward93_id",
					  value:100
					}),
					new OpenLayers.Filter.Comparison({
					  type:OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
					  property:"ward93_id",
					  value:50
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
					  property:"ward93_id",
					  value:50
					}),
					new OpenLayers.Filter.Comparison({
					  type:OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
					  property:"ward93_id",
					  value:10
					})
				]
			}),
			symbolizer: {Polygon:{fillColor:'#68c2e7'}}
		});
		
		range1 = new OpenLayers.Rule({
			filter: new OpenLayers.Filter.Comparison({
				type:OpenLayers.Filter.Comparison.LESS_THAN,
				property:"ward93_id",
				value:10
			}),
			symbolizer:{Polygon:{fillColor:'#aed0da'}}
		});
		
		range0 = new OpenLayers.Rule({
			filter: new OpenLayers.Filter.Comparison({
				type:OpenLayers.Filter.Comparison.EQUAL_TO,
				property:"ward93_id",
				value:"No Data"
			}),
			symbolizer:{Polygon:{fillColor:'#cccccc'}}
		});
		
		theme.addRules([range1, range2, range3, range4, range5, range0]);

		return new OpenLayers.StyleMap({'default':theme});
	}        