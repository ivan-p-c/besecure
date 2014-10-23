// JavaScript Document
var geocoder = null;
var map = null;
var searchHide = false;
var searchKeypress = false;
var sqlfilter=null;
var prevbounds=null;
var locationname=null;
var iscouncilarea=false;
var selpolygon=null;
var radiuspoly=null;
var radiuscentre=null; 
var svLatLng=null;
var lgdname="";
var searchMarker=null;
var appMarkers =new Array();
var colors =new Array()
var localSales = null;
var gslyrs = null;
var indxMapLayer = -1;
var niludlayer='NILUDSites';
colors["ZONED WITHOUT CONSENT"]="#999999";
colors["NOT STARTED WITH CONSENT"]="#36C5FF";
colors["DEVELOPMENT ON-GOING"]="#FF8319";
colors["DEVELOPMENT STALLED"]="#F0EF0B";
colors["AWAITING CONSENT"]="#3A3FC4";
colors["RECENTLY COMPLETED"]="#BF0500"
var NILatLongSW = new google.maps.LatLng(54.01, -8.2); //lat,long
var NILatLongNE = new google.maps.LatLng(55.31, -5.42); //lat,long
var NILatLongBounds = new google.maps.LatLngBounds(NILatLongSW, NILatLongNE);
var chartWidth = 400;
var tableWidth = 420;
var selectionpolygon = null;
// street view stuff
var panoClient=null;
var panoramaOptions = null;
var myPano=null;
google.load('visualization', '1', {
    packages: ['corechart','table']
    });  
    
$(document).ready(function() {
    addAutoComplete();
    setupToolBar();
    loadMap();
    setuptheUI();
    setupSliders();
    
}); //end of doc ready 

function setupToolBar(){
    if(!$.browser.msie && !$.browser.version=="6.0")$("select,input:checkbox").uniform();
    //Toolbar item events
    $('#hand_b').click(function() {stopEditing();});
    $('#shape_b').click(function() {closeRadiusDialog();startShape();drawingManager.setOptions({drawingMode: google.maps.drawing.OverlayType.POLYGON});});
    $('#radius_r').click(function() {showRadiusDialog();disableDrawing();});
    $('#erase_e').click(function() {clearPolygon(true);disableDrawing();showLocalSales(12);});
    $('#bymapcentre,#byselpoly').change(function() {radiusSearch($('#radiusdistance').val());});
    $('#closradius').click(function() {closeRadiusDialog();return false;});
    $("#maplegend").mouseover(function() {showLegend();}).mouseout(function(){hideLegend();});
    $("#SearchFind").click(function(){findLocation($("#SearchTextBox").val());return false;});
    $('#exporttocsv').click(function() { _gaq.push(['_trackEvent', client_number, 'Excel Export']);exportToCSV();return false;});
    $('#exporttopdf').click(function() {_gaq.push(['_trackEvent', client_number, 'PDF Export']);reportToPDF();return false;});
    $('#exportSales').click(function() {_gaq.push(['_trackEvent', client_number, 'Excel Export Sales']);exportSalesToCSV();return false;});
    //end of toolbar events
    //Search Box events
    $("#startPlanningSearch").click(function(){searchPlanning($('#planningSearch').val(),1,null);return false;});
    $("#clearPlanningSearch").click(function(){clearSearchResults();return false;});
    //End of search box events
    //$('#showareasales').click(function(){showLocalSales(12);}); //Area Sales Checkbox
    $('.asales').click(function(){showLocalSales(12);});
    $('#niludbytable').click(function() {$('#niludbychart').attr('checked',false);$('#popchart').hide(); $('#areasummarytext').show();});
    $('#niludbychart').click(function() {$('#niludbytable').attr('checked',false);$('#areasummarytext').hide();$('#popchart').show();});
    //Threat Score Handlers
    $('#addthreat').click(function() {addThreat();});
    $('#playthreat').click(function() {playThreat();_gaq.push(['_trackEvent', client_number, 'Threat Score']);});
    $('#mortcalc').click(function() {mortCalculate($('#mortdeposit').val(),$('#mortmult').val());_gaq.push(['_trackEvent', client_number, 'mortgage calculator']);});
    $('img.ts').hover(function() {$(this).css('cursor','pointer');}, function() {$(this).css('cursor','auto');});
}
function setuptheUI(){
    var tabOpts = {
        disabled:[1]
    };
    $('#tabs').tabs(tabOpts);
    $('#tabs').bind("tabsshow", function(event, ui) {
        $('#layerinfo').hide();
        $('#summarycaption').hide();
        $('#svcaption').hide();
        $('#searchsummary').hide();
        //Planning Tab
        if($("#tabs").tabs("option", "selected" )==0){							
            $('#summarycaption').show();
            $('#bwmapinfo').show();
            updatePlanningTab();
            $('#areasummaryradio').show();
        //Demand Tab        
        }else if($("#tabs").tabs("option", "selected" )==4){
            getCouncilData(map.getCenter(),true);
            plotvacancy('');
            $('#bwmapinfo').show();
            $('#areasummaryradio').hide();
            $('#popchart').hide();
        //Layers Tab
        }else if($("#tabs").tabs( "option", "selected" )==3){
            $('#bwmapinfo').hide();
            $('#layerinfo').show();
            $('#popchart').hide();
        //Site Info Tab
        }else if($("#tabs").tabs( "option", "selected" )==1){
            $('#areasummaryradio').hide();
            $('#summarycaption').hide();
            $('#popchart').hide();
            $('#areasummarytext').show();
            $('#bwmapinfo').show();
            $('#svcaption').show();
            if (svLatLng!=null){
                showStreetView(svLatLng);
            }
        //Search Tab
        }else if($("#tabs").tabs( "option", "selected" )==6){
            $('#bwmapinfo').hide();
            $('#searchsummary').show();
        //Sales Tab
        }else if($("#tabs").tabs( "option", "selected" )==2){					
            $('#summarycaption').show();
            $('#bwmapinfo').show();
            $('#areasummarytext').show();
            if ($('#niludbychart').attr('checked')=='checked'){
                $('#niludbychart').attr('checked',false);
                $('#niludbytable').attr('checked',true);
                $('#popchart').hide();
            }
            
            updateSalesTab();
            $('#areasummaryradio').hide();
        //HPI tab
        }else if($("#tabs").tabs( "option", "selected" )==5){
            $('#bwmapinfo').hide();
            getHPIndexes();
        }                          
    });
			
    //hover states on the static widgets
    $('#dialog_link, ul#icons li').hover(
        function() {
            $(this).addClass('ui-state-hover');
        }, 
        function() {
            $(this).removeClass('ui-state-hover');
        }
        );
    
    //Layers Accordion
    $("#accordion").accordion({
        header: "h3",
        autoHeight: false,
        collapsible: true,
        change: function(event,ui) {
            if($(ui.newHeader).attr('id')==undefined){
                if (gslyrs!=null){
                    gslyrs.offAllLayers();
                    updateSliderOpacity(gslyrs.getLayer(niludlayer).opacity);
                }
                $('#opacitylabel').text('NILUD ');
            }else{
                ShowLayer($(ui.newHeader).attr('id'));
                $('#opacitylabel').text($(ui.newHeader).text());
            }
        },
        changestart: function() {
            $('#layerinfo').html('');
        }
    });
	
    select("hand_b");
    $("#accordion").accordion("activate",false);   	
    
    $('#showniludlabels').click(function() {
        AddLabels($('#showniludlabels').attr('checked'));
    });
    //WAS in loadmap
    $('#tabs').show();
   
    var lhcol_height= $(document).height()- ($('#hdr').height()+$('#banner').height()+150);
    if (lhcol_height<850){   
        lhcol_height=850;
    }else if (lhcol_height>900){
        lhcol_height=900;
    }
    $('#lh-col').css("height", lhcol_height);
    $('#tabs').css("height", lhcol_height-10);
    //End of was in loadmap
}

function setupSliders()
{
     //CQL Filter slider
    $("#sliderstuff").piiSlider({'min':1,'max':2500});
    $("#sliderstuff").change(function(event, minValue, maxValue) {
        sliderUpdate("remaining_potential",minValue,maxValue);
        //If labels are on redraw them
        AddLabels($('#showniludlabels').attr('checked'));
    });
    //RADIUS SLIDER
    $("#radiusdistance").val(500);
    $("#radiusslider").slider({value:500,range: "min",min: 0,max: 5000,step: 25,
        slide: function(event, ui) {
            $("#radiusdistance").val(ui.value);
        },
        stop: function(event, ui) {
            var seltabInt=getSelecteTab();
            if(seltabInt!=0 && seltabInt!=2){
                $('#tabs').tabs('select', '#tabs-1');
            }
            radiusSearch((ui.value));
            showLocalSales(12);
        }
    });
    $("#radiusslider").show();
    //OPACITY SLIDER
    $("#slider").slider({range: "min",min: 0,max: 100,value: 100,step: 10,slide: function(event, ui) {
            $("#amount").val(ui.value);
            changeOpacity((ui.value/100));
            $('.boxColor').css('opacity',ui.value/100);
        }
    });
    
    $("#amount").val($("#slider").slider("value"));
}

		     
function loadMap() {
    //if (GBrowserIsCompatible()) {
        $('#loading').hide();
        $('#tabs').hide();
        $('#tabs').tabs('disable',1);
        var startlatlng = new google.maps.LatLng(55.167103352113834,-6.72170166015625);
        var myOptions = {
            zoom: 6,
            center: startlatlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById("piimap"), myOptions);

        google.maps.event.addListener(map, "click", function(event) {
            if (($('#shape_b').hasClass('selected')==false)) {
                getPointInfo(event.latLng);
            }
        });
        addDrawingManager(map);
        addMoveEndEvent();
        geocoder = new google.maps.Geocoder();
        findLocation('Belfast, UK');
        initLayers();
        updateSliderOpacity(1.0);
//}
}

function initLayers(){
    var layers = new Array();
        var geoServer = "http://www.spatialest.com/geoserver/";
        var serverDyn = geoServer;
        layers.push(new GSLayer("askingPrice1","live:PP201106",serverDyn,false,"na"));
        layers.push(new GSLayer("landuse1","live:landuse_themed",serverDyn,false,"na"));
        layers.push(new GSLayer("nra_regions","investni:nra_regions",serverDyn,false,"na"));
        layers.push(new GSLayer("capvalues","live:ni_capval_diff",serverDyn,false,"na"));
        layers.push(new GSLayer("socioeconomic","live:irelandse",serverDyn,false,"na"));
        layers.push(new GSLayer("demographic_hb","live2011:demographics_perHB",serverDyn,false,"na"));
        layers.push(new GSLayer("demographic_esa","live2011:demographics_perESA",serverDyn,false,"na"));
        layers.push(new GSLayer("bbc_2010","live2011:bbc_2010",serverDyn,false,"na"));
        layers.push(new GSLayer("bbc_2010res","live2011:bbc_2010_res",serverDyn,false,"na"));
        layers.push(new GSLayer(niludlayer,"live2011:nilud_sites2",serverDyn,true,"na")); 
        layers.push(new GSLayer("pointer","live:pointer_ongoing",serverDyn,false,"na"));
        gslyrs = new GSLayers(map,layers);
        gslyrs.enableLayer(niludlayer,1.0);
}

function ShowLayer(layername){
    var opacity = gslyrs.getLayer(layername).opacity
    indxMapLayer=parseInt($("#accordion").accordion("option", "active"),10);
     if(indxMapLayer>=0){
         gslyrs.enableLayer(layername,opacity);
     }else{
         if (gslyrs!=null){gslyrs.offAllLayers();}
     }
     updateSliderOpacity(opacity);
}

function sliderUpdate(variable,minValue,maxValue)
{
    var filter = variable+"%3E="+minValue+"+AND+"+variable+"%3C="+maxValue;
    sqlfilter =  variable+"%3E="+minValue+"%20AND%20"+variable+"%3C="+maxValue;
    gslyrs.getLayer(niludlayer).cql="&cql_filter=" + filter;
    gslyrs.getLayer(niludlayer).refreshCustom(map);
    if($('#summarybyradius').attr('checked')){
        summaryBy('radius',$('#piiSliderMin').text(),$('#piiSliderMax').text());
    }else{
        summaryBy('map',$('#piiSliderMin').text(),$('#piiSliderMax').text());
    }
} 
function updateSliderOpacity(opacity){
     $("#slider").slider( "value" ,opacity*100);
     $("#amount").val($("#slider").slider("value"));
    
}
    
function positionlegend(legendname){
    var offset = $('#maplegend').offset();
    element = $("#"+legendname)
    .css("position", "absolute")
    .css("top", offset.top + $('#inputString').height()+30)
    .css("left", offset.left)
} 
    
//Position the radius search
function positionRadiusDialog(){
    var offset = $('#radius_r').offset();
    element = $(".radiusslider")
    .css("position", "absolute")
    .css("top", offset.top + $('#radius_r').height()+5)
    .css("left", offset.left)
    .css("height", 100)
    .css("width", 250)
    .css("z-index",99991)
} 
    
function showRadiusDialog(){
    select("radius_r");
    $(".radiusslider").show();
    positionRadiusDialog();
}
function closeRadiusDialog(){
    $(".radiusslider").hide();
    select("hand_b");
}
     
//find location and load urban layer polygon and all planning polygons
function findLocation(location) {
    _gaq.push(['_trackEvent', client_number, 'Search: ' + location]);
    $("#radiustable").html('');
    $('#layerinfo').html('');
    $('#pointinfo').hide();
    $('#tabs').tabs("select",0);
    geocoder.geocode( {'address': location, bounds:NILatLongBounds, region:'GB'}, function(results, status) {         
          //restrict suggestions to NI Bounds
          var ni_results = new Array(0);
          var resultCount = results.length;
          for (var i = 0; i < resultCount; i++){
              if (NILatLongBounds.contains(results[i].geometry.location)){
                ni_results.push(results[i]);
              }
          }
          results = ni_results;
          if (results.length>0){
            var location = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());
            //marker.setPosition(location);
            //map.setCenter(location);
            var goToBounds = false;
            if (results[0].geometry.bounds != null){
              if (!results[0].geometry.bounds.isEmpty()){
                goToBounds = true;
              }
            }
            
            if (goToBounds){
              map.fitBounds(results[0].geometry.bounds);
            }
            else{
                if (!goToBounds && !results[0].geometry.viewport.isEmpty()){
                    var bounds = new google.maps.LatLngBounds(results[0].geometry.viewport.getSouthWest(),results[0].geometry.viewport.getNorthEast());
                    map.fitBounds(bounds);
                    var zm = map.getZoom();
                    map.setZoom(zm-1);
                }else{
                    map.setCenter(location);
                }
            }
          }

    });
}
    
function getCouncilData(point,forceRefresh){
    $.get("pg_getcouncil.php",{lat:point.lat(),lng:point.lng()},function(data){
        if (data!=lgdname || forceRefresh){
            lgdname=data;
            getHGIvalues(data);
        }
    });
}
function changeOpacity(op) {
    if( $("#accordion").accordion( "option", "active" )===false){
        //set opacity of the nuilud layer
        if (gslyrs!=null){gslyrs.getLayer(niludlayer).setOpacity(op);} 
    }else{
        //set opacity of active layer
        var lyrname= $("#accordion h3").eq($("#accordion").accordion( "option", "active" )).attr("id");
        if (gslyrs!=null){gslyrs.getLayer(lyrname).setOpacity(op);} 
    }
    updateSliderOpacity(op);
}

//GET The number of applications and type of application
function createplanningsummary(plansummary){
    var pdata=null;
    pdata = new google.visualization.DataTable();
    pdata.addColumn('string', 'Description');
    pdata.addColumn('number', 'No.');
    var totalrows= plansummary.length;
    pdata.addRows(totalrows);
    //var description = null;
    for (var i = 0; i < plansummary.length; i++) {
        pdata.setCell(i, 0,plansummary[i].getAttribute("description"));
        pdata.setCell(i, 1, parseInt(plansummary[i].getAttribute("countplanning"),10));
    }
    return pdata;
}

//Get HGI values for the location depending on Council area
function getHGIvalues(thelocation){
    $.get("pg_gethgi.php",{location:thelocation,json:1},function(data){
        var tdata=new google.visualization.DataTable(data.jsontable, 0.6);
        plothgi(tdata,data.council,data.startyear);
        $('#hgi_council').text(data.council);
        $('#hgi_original').text(addCommas(data.origrate));
        $('#hgi_adjusted').text(addCommas(data.adjrate));
        if (data.adjrate>0){
            $('#hgi_percent').text(getformatPercent(data.adjrate-data.origrate,data.adjrate) + '%');
            $('#hgi_difference').text(addCommas(data.adjrate-data.origrate));
            $('#hgi_annual').text(addCommas(data.yradjrate));
        } 
    });
}

function plotvacancy(council){
    $.get("pg_housing_stock.php",{y1: map.getBounds().getSouthWest().lat(),x1:map.getBounds().getSouthWest().lng(),y2: map.getBounds().getNorthEast().lat(),x2:map.getBounds().getNorthEast().lng(),json:1},function(data){
        var tdata=new google.visualization.DataTable(data, 0.6);
        var dvdt = new google.visualization.DataView(tdata);
            dvdt.setColumns([0,3,4]);
            //curveType: "function",width: 500, height: 400,vAxis: {maxValue: 100}}
            new google.visualization.LineChart(document.getElementById('housingstockchart')).draw(dvdt, {
                curveType: "function",legend:'bottom', width: chartWidth, height: 250,vAxis: {maxValue: 15,minValue:0},
                title: 'Housing Stock Total and Vacancy Levels (2002-2010) ' + council});
            table = new google.visualization.Table(document.getElementById('housingstocktable'));
            table.draw(tdata, {'showRowNumber': false, 'allowHtml': true, width:tableWidth,cssClassNames:{tableCell : 'gtd2',headerCell: 'gth2'}});
    });
}
		
		
//function plothgi(originalrate,adjustedrate,adjustedtotal,originaltotal,council,startyear,numyears,actualunitsxml){
function plothgi(tdata,council,startYear){
    $('#growthindicatorchart').html('');
    var dvdt = new google.visualization.DataView(tdata);
    dvdt.setColumns([0,2,3]);
    new google.visualization.LineChart(document.getElementById('areasummarytext')).draw(tdata, {
        legend:'bottom',curveType: "function",lineSize:2,titleFontSize:10,width:460,height:275,
        title: 'Growth Indicator New Builds Actual to Forecast (' + startYear + '-2009) ' + council
    });
}
    
//Load planning applications a NILUD data for the selected site
function loadplanappsfornilud(urlpath,pointlatlng){
    clearPolygons();
    $('#loading').show();
    $('#tabs').tabs('enable' , 1);
    $('#tabs').tabs('select', '#tabs-2');
    $.get(urlpath,function(data){
        if(data.indexOf("class=\"warning\"") != -1 && $("#accordion").accordion("option" , "active")!==false){
            //Load layer info
            getLayerPointInfo(pointlatlng,$("#accordion").accordion("option" , "active"),"infodiv",true);
        }
        $('#infodiv').html(data);
					    
        $('#loading').hide();
        resetRadioButtons();
        var polypath=$('#polypath').html();
        //polygon is multipolygon((( and remove trailing )))
        if (polypath!=null){
            if (polypath.substring(1,0)=='M'){
                drawwkbfpolygon(polypath.substring(13,polypath.length-1));
            } else{
                drawwkbfpolygon(polypath.substring(9,polypath.length-2));
            }
        }
        options={lat: pointlatlng.lat(),lng: pointlatlng.lng(),json:1};
        pgurl= "pg_bound_compunits.php";
        $('#infodiv').prepend('<div id="siteunitchart"></div>');
        drawBuiltUnitsChart(pgurl,options,'siteunitchart');
        $("#planappsaccordion").accordion({
            autoHeight: false
        });
        $('#planappsaccordion .x').each(function(index) {
            options={
                appNumber:$(this).find('.appref').text()
                };
            pgurl="planning_docs_available.php?appNumber=" + $(this).find('.appref').text();
            $(this).find('.appdocs').load(pgurl,function(){});
        });
    });
}
    
function clearPolygons(){
    if (selpolygon!=null){
        if(isArray(selpolygon)){
            for (j=0; j<selpolygon.length; j++)  {
                selpolygon[j].setMap(null);
            }
        }else{
             selpolygon.setMap(null);
        }
        selpolygon=null;
    }
}
    	
function resetRadioButtons(){
    //Disable Selection linked radio buttons
    $("#byselpoly").attr("disabled", "disabled");
    $("#byselpoly").removeAttr("checked");
    //Set state back to default
    $("#bymapcentre").attr("checked", "checked");
}
    
function validate(e){
    if(e.target.value==''){
        e.target.value=0;
    }
}
function getformatPercent(num, denom){
    if (num==0 || denom==0){
        return 0;
    }else{
        var percent = (num/denom)*100;
        return formatnumber(percent);
    } 
}
function formatnumber(num){
    var fnum = null;
    fnum=parseInt(num*100,10)/100;
    return fnum;
}
     
function zoomtopolygon(x1,y1,x2,y2){
    prevbounds = map.getBounds();
    var sw= new GLatLng(y1,x1);
    var ne= new GLatLng(y2,x2);
    var bounds = new GLatLngBounds(sw,ne);
    map.setCenter(bounds.getCenter());
    map.setZoom(map.getBoundsZoomLevel(bounds)-1);
    $('#undozoom').show();
}
  
function prevextent(){
    if (prevbounds!=null){
        map.setCenter(prevbounds.getCenter());
        map.setZoom(map.getBoundsZoomLevel(prevbounds));
        prevbounds=null;
        $('#undozoom').hide();
    }
}  
//Generate Average Asking Price Chart
function getaverageasking(x1,x2,y1,y2){
    alert('getaverageasking');
    /*$('#avgaskingchart').css('background','url(images/wait-loader2.gif) no-repeat center');
    $('#avgaskingchart').load("pg_getarea_askingprice.php?x1=" +x1+"&x2="+x2+"&y1="+y1+"&y2="+y2,function(){$('#avgaskingchart').css('background','none');}); */
        
}
function createBlankAskingPriceTable(){
    alert('createBlankAskingPriceTable');
}
    
function geatAreaPopulation(polygonstr){
    alert('geatAreaPopulation');
    var options=null;
    var pgurl= "pg_getareapop.php";
    if ((radiuspoly==null) && (selectionpolygon==null)) {
        options={
            y1:map.getBounds().getSouthWest().lat(),
            x1:map.getBounds().getSouthWest().lng(),
            y2: map.getBounds().getNorthEast().lat(),
            x2:map.getBounds().getNorthEast().lng()
            };
    }else{
        options={
            polygon:escape(polygonstr)
            };
    }
    $.get(pgurl,options,function(data){
        $(data).find('population ').each(function(){
            $('#population').text($(this).attr("total"));
        });
    });
} 
    
function getAreaAskingPrice(polygonstr,showTable){
    var options=null;
    var pgurl=null;
    //if ((radiuspoly==null) && (selectionpolygon==null)) { 
    if (polygonstr==null) {
        //Get the map extent if the polygon or radius
        options={
            y1:map.getBounds().getSouthWest().lat(),
            x1:map.getBounds().getSouthWest().lng(),
            y2: map.getBounds().getNorthEast().lat(),
            x2:map.getBounds().getNorthEast().lng(),json:1
            };
        pgurl= "pg_getarea_askingprice.php";
    }else{
        options={
            polygon:escape(polygonstr),json:1
            };
        pgurl="pg_getarea_askingprice.php";
    }
    $.post(pgurl,options,function(data){
        var tdata = new google.visualization.DataTable(data.jsontable, 0.6); 
        if(tdata.getNumberOfRows()==0){
            $('#loading').hide();
            $('#areasummarytext').html('<p>There is currently no sales evidence for the area.</p>');
        }else{
            new google.visualization.BarChart(document.getElementById('areasummarytext')).
            draw(tdata,
            {
                title:"Average Asking Price by Property Type",
                width:390, height:300,vAxis: {textStyle:{fontSize:9}},hAxis: {title: "Average Price",minValue:0,
                logScale:false,textStyle:{fontSize:9}},colors:['#9ADBA1','#038712'],legend:'bottom',titlePosition:'out',chartArea:{left:150,width:370,top:20}
            });
			  	 		
        }
//create summary table
    $('#avg_prop').html(data.average);
    $('#min_prop').html(data.min);
    $('#max_prop').html(data.max);
    $('#count_prop').html(data.count);
});
return false;	
}
    
function createBlankBuiltUnitsTable(){
    alert('createBlankBuiltUnitsTable');
}
    
function getAreaBuiltUnits(polygonstr){
    var options=null;
    var pgurl=null;
    if ((radiuspoly==null) && (selectionpolygon==null)) {
        options={
            y1:map.getBounds().getSouthWest().lat(),
            x1:map.getBounds().getSouthWest().lng(),
            y2: map.getBounds().getNorthEast().lat(),
            x2:map.getBounds().getNorthEast().lng(),json:1
            };
        pgurl= "pg_bound_compunits.php";
    }else{
        options={
            polygon:escape(polygonstr),json:1
            };
        pgurl="pg_bound_compunits.php";
    }
    drawBuiltUnitsChart(pgurl,options,'compunitchart');
    return false;	
}
		
function drawBuiltUnitsChart(pgurl,options,divname){
    $.post(pgurl,options,function(data){
        var JSONObject = data;
        var tdata = new google.visualization.DataTable(JSONObject, 0.6);
        if(tdata.getNumberOfRows()>0){
            new google.visualization.ColumnChart(document.getElementById(divname)).
            draw(tdata,
            {   title:"Completed Units By Year",
                width:chartWidth, height:175,
                vAxis: {title: "Units",logScale:false,textStyle:{fontSize:9},minValue:0},
                hAxis: {title: "Year"},
                colors:['#C0504D'],legend:'none',chartArea:{left:50, width:400}
            });
            $('#loading').hide();
        }else{
            $('#' + divname).html('<h4 style="padding-left:10px;">No units completed since 2002</h4>');
        }
					
    });
}

function stripslashes(str)
{
    return str.replace(/\//g, '');
} 
    
function addMoveEndEvent() {
    google.maps.event.addListener(map, 'idle', function () {
        getInfoByMap();
        showLocalSales(12);
        if(map.getZoom()>=12){
            $('.asales').removeAttr("disabled");
            $('#showareasalescap').css('color',"#000");
        }else{
            $('.asales').attr("disabled", true);
            $('#showareasalescap').css('color',"#c0c0c0");
        }
    });
}
    
function getInfoByMap(){
    if ((radiuspoly==null) && (selectionpolygon==null)) {
        $('#summarycaption').html('Summarise by:&nbsp;&nbsp; Map Area');
        $('#loading').show();
        if($("#tabs").tabs( "option", "selected" )==0){
            updatePlanningTab();
        }else if($("#tabs").tabs( "option", "selected" )==4){
            getCouncilData(map.getCenter(),false);
            plotvacancy('');
        }else if($("#tabs").tabs( "option", "selected" )==2){
            updateSalesTab();	
        }else if($("#tabs").tabs( "option", "selected" )==5){
            getHPIndexes();
        }
        $('#loading').hide();
    }
}
    
function updateSalesTab(){
    if ((radiuspoly==null)&&(selectionpolygon==null)){
        getAreaSalesInformation(null);
        getAreaAskingPrice(null,0);
    }else {
        var polystr=null;
        if(radiuspoly==null){
            polystr=getPointsFromPolygon(selectionpolygon);
        }else{
            polystr=getPointsFromPolygon(radiuspoly);
        }
        getAreaSalesInformation(polystr);
        getAreaAskingPrice(polystr,0);
    }	      	      
}
function updatePlanningTab(){
    getAreaBuiltUnits(null);
    if ((radiuspoly==null) &&(selectionpolygon==null)){
        getboundssummary(null);
    } else {
        var polystr=null;
        if(radiuspoly==null){
            polystr=getPointsFromPolygon(selectionpolygon);
        }else{
            polystr=getPointsFromPolygon(radiuspoly);
        }
        getPolygonSummary(polystr);
    }
}
    
//Export all visible data to EXCEL
function exportalltocsv(urlstr){
    /*var urlparams=urlstr + '?y1=' + map.getBounds().getSouthWest().lat() +'&x1=' + map.getBounds().getSouthWest().lng() +'&y2=' + map.getBounds().getNorthEast().lat() + '&x2=' + map.getBounds().getNorthEast().lng() + '&summaryby=' + $('#mapsummaryby').attr('value');
    $('#alltocsv').attr('href',urlparams);*/
    alert('exportalltocsv');
    
}
    
function getboundssummary(summaryby)
{
    if (summaryby==null){
        summaryby=$('#mapsummaryby').attr('value');
    }
    var urlstr="pg_boundssummary.php"; 
    var options = {y1:map.getBounds().getSouthWest().lat(),
        x1:map.getBounds().getSouthWest().lng(),
        y2:map.getBounds().getNorthEast().lat(),
        x2:map.getBounds().getNorthEast().lng(),json:1};
    if (sqlfilter!=null){
        options["condition"]=sqlfilter;
    }
    $.get(urlstr,options,function(data){
        var tdata = new google.visualization.DataTable(data, 0.6);
        table = new google.visualization.Table(document.getElementById('areasummarytext'));
        table.draw(tdata, {'showRowNumber': false, 'allowHtml': true, width:tableWidth,cssClassNames:{tableCell : 'gtd2',headerCell: 'gth2'}});
        $('#areasummarytext').css('background','none');
        popChart(tdata);
    });
}
    
function createBlankSummaryTable(){
    alert('createBlankSummaryTable');
}
function createBlankSummaryByPopTable(){
    alert('createBlankSummaryByPopTable');
}
//Load summary table with no information
function loadBlankSummaryTable(){
    alert('loadBlankSummaryTable');
}
//CREATE THE DATATABLE FOR Bounds Summary
function createSummaryTable(xml){
    alert('createSummaryTable');
} 
    
function sumColumn(table,col){
    var total=0;
    var num = table.getNumberOfRows();
    for (i=0;i<num;i++){
        total += table.getValue(i, col);	
    }
    return total;
}

function redrawplan(){
    alert('redrawplan');
}
    
    
function radiusSearch(distance){
    $('#loading').show();
    $('#summarycaption').text('Summarise by: Radius selection');
    var numsites=0;
    $('#loading').show();
    clearPolygon(false);
    var mapPoint=null
    if ($('#bymapcentre').attr('checked')){
        mapPoint=map.getCenter();
    }else{	
        mapPoint=polygonGetBounds(selpolygon[0]).getCenter();	
    }
    radiuscentre = mapPoint;
    drawCircle(mapPoint, distance/1000, 40,'#0000ff',2,1,'#0000ff',0.10);
    		
    $.get("pg_nilud_site_information.php",{
        lat:mapPoint.lat(),
        lng:mapPoint.lng(),
        dist:distance,
        min:$('#piiSliderMin').text(),
        max:$('#piiSliderMax').text(),
        getrecords:$('input[name=showniludsites]').is(':checked')
        },function(data){
					
        if($('input[name=showniludsites]').is(':checked')){	
            numsites=getNiludSitesResults(data);
            $('#numsitesradius').html('<b>'+numsites+'</b>'); 
        }else{
            getNumberofNiludSites(data);
        }
        $('#loading').hide();	
    });
    summaryBy('radius',$('#piiSliderMin').text(),$('#piiSliderMax').text());
}

function getNumberofNiludSites(data){
    $(data).find('results').each(function(){
        $('#numsitesradius').html('<b>'+$(this).attr("counter")+'</b>');
    });
}
		
function createNiludSitesTable(){
    alert('createNiludSitesTable');
}
		
function clearNiludTable(){
    var tdata=createNiludSitesTable();
    table = new google.visualization.Table(document.getElementById('radiustable'));
    table.draw(tdata, {'showRowNumber': false, 'allowHtml': true, width:tableWidth,cssClassNames:{tableCell : 'gtd',headerCell: 'gth2'}});
}
		
function getNiludSitesResults(data){
    var tdata=createNiludSitesTable();
    var num_rows=0;
    $(data).find('results').each(function(){
        tdata.addRows([
            [$(this).attr("niludref"),$(this).attr("status"),parseFloat($(this).attr("area_developed")),parseFloat($(this).attr("area_remaining")),parseInt($(this).attr("units_complete"),10),parseInt($(this).attr("remaining_potential"),10),parseFloat($(this).attr("distances"))] 
            ]);
        num_rows++;
    });
    table = new google.visualization.Table(document.getElementById('radiustable'));
    var formatter = null
    formatter= new google.visualization.NumberFormat({
        fractionDigits:2
    });
    formatter.format(tdata, 6);
    //page:'enable' ,pageSize:10
    table.draw(tdata, {
        'showRowNumber': false, 
        'allowHtml': true, 
        width:540,
        cssClassNames:{
            tableCell : 'gtd',
            headerCell: 'gth2'
        }
    });
$('#loading').hide();
return num_rows; 
}
		
		
		
function createHPITable(){
    /*var tdata=null;
    tdata = new google.visualization.DataTable();
    tdata.addColumn('string', "Quarter");
    tdata.addColumn('number', 'NI Average');
    tdata.addColumn('number', 'Area Average');
    tdata.addColumn('number', 'Difference');
    return tdata; */
    alert(creatHPITable);
}
		
function getHPIndexes(){
    $.get("pg_gethpi.php",{
        lat:map.getCenter().lat(),
        lng:map.getCenter().lng(),json:1
        },function(data){
        var areaname=data.area;
        var tdata=new google.visualization.DataTable(data.jsontable, 0.6);
        var dvdt = new google.visualization.DataView(tdata);
        dvdt.setColumns([0,1,2]);
        new google.visualization.LineChart(document.getElementById('hpichart')).draw(dvdt, {curveType: "function",legend:'bottom', width: chartWidth, height: 275,
            vAxis: {minValue:100000},
            chartArea: {left:80,top:40,width:"90%",height:"60%"},
            title: 'Housing Price Indexes for ' + areaname
            });
        var formatter = new google.visualization.NumberFormat({
            prefix: '&pound;',
            fractionDigits:0
        });
        formatter.format(tdata, 1); 
        formatter.format(tdata, 2);
        formatter = new google.visualization.TableBarFormat({width: 80,colorNegative:'red',colorPositive:'green'});
        formatter.format(tdata, 3); // Apply formatter to second column
        table = new google.visualization.Table(document.getElementById('hpitable')); 
        table.draw(tdata, {'showRowNumber': false, 'allowHtml': true, width:tableWidth,cssClassNames:{tableCell : 'gtd2',headerCell: 'gth2'}});
    });
}
		
		
var bounds = new google.maps.LatLngBounds();
function fit(){
    map.panTo(bounds.getCenter()); 
    map.setZoom(map.getBoundsZoomLevel(bounds));
}
		
function drawCircle(center, radius, nodes, liColor, liWidth, liOpa, fillColor, fillOpa)
{
    if (radiuspoly!=null){
        //map.removeOverlay(radiuspoly);
        radiuspoly.setMap(null);
    }
    //calculating km/degree
    var latConv = google.maps.geometry.spherical.computeDistanceBetween(center, new google.maps.LatLng(center.lat()+0.1, center.lng()))/100;
    var lngConv = google.maps.geometry.spherical.computeDistanceBetween(center, new google.maps.LatLng(center.lat(), center.lng()+0.1))/100;
		 
    //Loop 
    var points = new google.maps.MVCArray();
    var step = parseInt(360/nodes,10)||10;
    for(var i=0; i<=360; i+=step)
    {
        var pint = new google.maps.LatLng(center.lat() + (radius/latConv * Math.cos(i * Math.PI/180)), center.lng() + 
            (radius/lngConv * Math.sin(i * Math.PI/180)));
        points.push(pint);
        bounds.extend(pint); //this is for fit function
    }
    //points.push(points[0]); // Closes the circle, thanks Martin
    fillColor = fillColor||liColor||"#0055ff";
    liWidth = liWidth||2;
    radiuspoly = new google.maps.Polygon({ paths: points,strokeColor: liColor,strokeOpacity: 1.0,strokeWeight: 2,fillColor: fillColor||liColor||"#0055ff",fillOpacity: fillOpa,clickable:true});
    $("#summarybyradius").removeAttr("disabled");
    radiuspoly.setMap(map);
    //Remove Radius if clicked
    google.maps.event.addListener(radiuspoly, "click", function(event) {
        getPointInfo(event.LatLng);
    });

}
		
function clearRadius(){
    if (radiuspoly!=null){
        radiuspoly.setMap(null);
    }
    $("#summarybyradius").attr("disabled","disabled");
    $('#radiustable').html('');
    $('#numsitesradius').html('<b>0</b>');
    return false;
}
    
function savemapstatetoJSON(){
    var jsonobj=null;
	   
    if (radiuspoly!=null) {
        map.setCenter(new google.maps.LatLng(radiuscentre.lat(),radiuscentre.lng()));
    }

    if (selectionpolygon!=null) {
        //map.setCenter(selectionpolygon.getBounds().getCenter());
        map.setCenter(polygonGetBounds(selectionpolygon).getCenter()); 
    }

    jsonobj='{\"map\":{';
    jsonobj+='\"width\":' + $('#piimap').width() + ',';
    jsonobj+='\"height\":' + $('#piimap').height() + ',';
    jsonobj+='\"swlng\":' + map.getBounds().getSouthWest().lng() + ',';
    jsonobj+='\"swlat\":' + map.getBounds().getSouthWest().lat() + ',';
    jsonobj+='\"nelng\":' + map.getBounds().getNorthEast().lng() + ',';
    jsonobj+='\"nelat\":' + map.getBounds().getNorthEast().lat() + ',';
    jsonobj+='\"centrelng\":' + map.getCenter().lng() + ',';
    jsonobj+='\"centrelat\":' + map.getCenter().lat() + ',';
    jsonobj+='\"zoomlevel\":' + map.getZoom() + ',';
    jsonobj+='\"layers\": ';
    jsonobj+= gslyrs.getLayerJson();
    
      
    //if radius polygon is on, get it added to json object
    if (radiuspoly!=null) {
        var gp1 = getDivPixel(new google.maps.LatLng(radiuscentre.lat(),radiuscentre.lng()));
        var gp2 = getDivPixel(new google.maps.LatLng(radiuspoly.getPath().getAt(0).lat(),radiuspoly.getPath().getAt(0).lng()));
        var r = null;
        r = Math.sqrt(Math.pow((gp1.x-gp2.x),2)+Math.pow((gp1.y-gp2.y),2));
			
        jsonobj+=', \"buffers\": [';
        jsonobj+='{';
        jsonobj+='\"x\": ' + gp1.x + ',';
        jsonobj+='\"y\": ' + gp1.y + ',';
        jsonobj+='\"r\": ' + r;
        jsonobj+='}]';
    }
    if (selectionpolygon!=null) {	
        jsonobj+=', \"polygons\": [';
        jsonobj+='{';
        jsonobj+='\"shape\": \"' + getPixelPointsFromPolygon(selectionpolygon) + '\"';
        jsonobj+='}]';
    }
    jsonobj +='}}';
    return jsonobj;
}
    
function summaryBy(byWhat,minValue,maxValue){
    var selectedTab=getSelecteTab();
    var radiusstr =null;	
    var tdata = null;
    if (byWhat=='radius' && selectedTab==0){
        //loadBlankSummaryTable();
        //clearNiludTable();
        radiusstr =getPointsFromPolygon(radiuspoly);
        getShapeArea(radiuspoly);
        getAreaBuiltUnits(radiusstr);
        if ($('#byselpoly').attr('checked')){
            $.post("pg_radius_summary.php",{
                dist:$('#radiusdistance').val(),
                min:minValue,
                max:maxValue,
                polygon:$('#polypath').text(),json:1
                },function(data){
                tdata = new google.visualization.DataTable(data, 0.6);
                table = new google.visualization.Table(document.getElementById('areasummarytext'));
                table.draw(tdata, {
                    'showRowNumber': false, 
                    'allowHtml': true, 
                    width:tableWidth,
                    cssClassNames:{
                        tableCell : 'gtd2',
                        headerCell: 'gth2'
                    }
                });
                popChart(tdata);
            $('#loading').hide();
            });
    }else{
        $.get("pg_radius_summary.php",{
            lat:map.getCenter().lat(),
            lng:map.getCenter().lng(),
            dist:$('#radiusdistance').val(),
            min:minValue,
            max:maxValue,json:1
        },function(data){
            tdata = new google.visualization.DataTable(data, 0.6); 
            table = new google.visualization.Table(document.getElementById('areasummarytext'));
            table.draw(tdata, {
                'showRowNumber': false, 
                'allowHtml': true, 
                width:tableWidth,
                cssClassNames:{
                    tableCell : 'gtd2',
                    headerCell: 'gth2'
                }
            });
            popChart(tdata);
            
        $('#loading').hide();
        });
}
}else if (byWhat=='radius' && selectedTab==2){
    if (radiuspoly!=null){
        //var area =(Math.round(radiuspoly.getArea() / 10000) / 100) + "km<sup>2</sup>";
        getShapeArea(radiuspoly);
        radiusstr =getPointsFromPolygon(radiuspoly);
        getAreaAskingPrice(radiusstr);
        getAreaSalesInformation(radiusstr);
        //getAreaBuiltUnits(radiusstr);
    }			
}else{
    if (selectedTab==0 || selectedTab==2){
        getboundssummary(null);
    }
}	
}

function popChart(tdata){
    var ni = new Array();
    ni["RECENTLY COMPLETED"]=3;
    ni["ZONED WITHOUT CONSENT"]=9;
    ni["NOT STARTED WITH CONSENT"]=55;
    ni["DEVELOPMENT ON-GOING"]=10;
    ni["DEVELOPMENT STALLED"]=14;
    ni["AWAITING CONSENT"]=25;
    tdata.addColumn('number', 'niaverage');
    for (var i=0;i<tdata.getNumberOfRows();i++){
        tdata.setCell(i,tdata.getNumberOfColumns()-1,ni[tdata.getValue(i,1)]);
    }
    var dvdt = new google.visualization.DataView(tdata);
    dvdt.setColumns([1,7,6]);
    new google.visualization.BarChart(document.getElementById('popchart')).
    draw(dvdt,
    {
        title:"Potential Units per 1,000 of population",
        width:440, 
        height:250,
        chartArea: {
            left:150
        },
        fontSize: 10,
        hAxis: {
            logScale:true,
            minValue:0
        },      
        vAxis: {
            textPosition: 'out',
            textStyle:{fontSize:9}
        },
        colors:['#038712','#D90000'],
        legend:'bottom'
    });
}
function getShapeArea(poly)
{
    var area = Math.round(google.maps.geometry.spherical.computeArea(poly.getPath())/10000) + " km<sup>2</sup>";
    $('#summarycaption').html('Summarise by:&nbsp;&nbsp; Shape Area: ' + area);
    return false;
}
function AddLabels(showLabels){
    /*if (showLabels){
        if (layercqlfilter==null){
            addLabelLayer(labellayername,"live");
        }else{
            addLiveLabelOverlay("live:" + labellayername,layercqlfilter);
        }
    }else{
        removeLabelLayers();	
    }*/
   // alert('TODO: add labels');
    
}
    
function getPointInfo(point){
    if ((point!=null)) {
        if($("#tabs").tabs( "option", "selected" )==3 && parseInt($("#accordion").accordion("option" , "active"),10)>=0){
            getLayerPointInfo(point,$("#accordion").accordion("option" , "active"),"layerinfo",false);
        }else{
            $('#tabs').tabs('enable',1);
            $("#accordion").tabs("option", "selected", 1);
            $('#layerinfo').hide();
            clearPolygons();
            loadplanappsfornilud('pg_siteinfo.php?lng=' +  point.lng() +'&lat='+ point.lat(),point);
            showStreetView(point);
            svLatLng=point;
        }
    }
}

function getLayerPointInfo(point,id,divid,appendFlag){
    var urlpath =null;
    if ((id==0)||(id==4)){
        var bounds=map.getBounds();
        var p1 = bounds.getNorthEast();
        var p2= bounds.getSouthWest();
        boundsStr=p2.lng()+','+p2.lat()+','+p1.lng()+','+p1.lat();
        var divPt=map.fromLatLngToContainerPixel(point);
        urlpath = 'pg_maplayerinfo.php?bounds=' + encodeURI(boundsStr) + '&divx=' + divPt.lng() + '&divy=' + divPt.lat() + '&layerid=' + id;	
    }else{
        urlpath = 'pg_maplayerinfo.php?lng=' + point.lng() + '&lat=' + point.lat() + '&layerid=' + id;
    }
    $('#loading').show();
    $.get(urlpath,function (data){
        if(appendFlag===true){
            $('#' + divid).append(data);
        }else{
            $('#' + divid).html(data);
            $('#' + divid).show();		
        }
        $('#' + divid + ' .x tr:odd').css("background-color", "#fafafa");
        $('#loading').hide();
    });			
}

/*function exportToCSV(){
    	var urlstr=null;
    	if (radiuspoly!=null) {
    		var radiusstr =getPointsFromPolygon(radiuspoly);
       		urlstr="pg_export_to_excel_radius.php";
    		var urlparams=urlstr + "?y=" + radiuscentre.y +"&x=" + radiuscentre.x +"&dist=" + $('#radiusdistance').val() + "&lower=" + $('#piiSliderMin').text() + "&upper=" + $('#piiSliderMax').text()
	      	window.location = urlparams;
			return;
		}else if(selectionpolygon!=null) {
			var polygon=null;
			polygon = getPointsFromPolygon(selectionpolygon);
			urlstr="pg_export_to_excel_polygon.php";
	   		var urlparams=urlstr + "?polygon=" + polygon + "&lower=" + $('#piiSliderMin').text() + "&upper=" + $('#piiSliderMax').text();  //+ "&polygon=" + escape(radiusstr);
	   		
    	  	window.location = urlparams;
			//alert('Polygon Selections are not currently supported');
			return;
		}else{
			urlstr='pg_export_to_excel.php';
		 	var urlparams=urlstr + '?y1=' + map.getBounds().getSouthWest().lat() +'&x1=' + map.getBounds().getSouthWest().lng() +'&y2=' + map.getBounds().getNorthEast().lat() + '&x2=' + map.getBounds().getNorthEast().lng() + '&lower=' + $('#piiSliderMin').text() + '&upper=' + $('#piiSliderMax').text();
      		//window.open(urlparams);
      		window.location = urlparams;
			//$('#exporttocsv').attr('href',urlparams);
			}
    } */
    
function exportToCSV(){
    var urlstr=null;
    var urlparams=null;
    if (radiuspoly!=null) {
        //var radiusstr =getPointsFromPolygon(radiuspoly);
        //urlstr="pg_export_to_excel_radius.php";
        urlstr="pg_export_to_excel.php";
        urlparams=urlstr + "?y=" + radiuscentre.lat() +"&x=" + radiuscentre.lng() +"&dist=" + $('#radiusdistance').val() + "&lower=" + $('#piiSliderMin').text() + "&upper=" + $('#piiSliderMax').text()
        window.location = urlparams;
        return;
    }else if(selectionpolygon!=null) {
        var polygon=null;
        polygon = getPointsFromPolygon(selectionpolygon);
        urlstr='pg_export_to_excel.php';
        urlparams=urlstr + "?polygon=" + polygon + "&lower=" + $('#piiSliderMin').text() + "&upper=" + $('#piiSliderMax').text();  //+ "&polygon=" + escape(radiusstr);
        window.location = urlparams;
        return;
    }else{
        urlstr='pg_export_to_excel.php';
        urlparams=urlstr + '?y1=' + map.getBounds().getSouthWest().lat() +'&x1=' + map.getBounds().getSouthWest().lng() +'&y2=' + map.getBounds().getNorthEast().lat() + '&x2=' + map.getBounds().getNorthEast().lng() + '&lower=' + $('#piiSliderMin').text() + '&upper=' + $('#piiSliderMax').text();
        window.location = urlparams;
    //$('#exporttocsv').attr('href',urlparams);
    }
}
    
function exportSalesToCSV(){
    var urlstr="pg_export_sales_to_excel.php";
    var urlparams=null;
    if (radiuspoly!=null) {
        //var radiusstr =getPointsFromPolygon(radiuspoly);
        //urlstr="pg_export_sales_to_excel.php";
        urlparams=urlstr + "?y=" + radiuscentre.lat() +"&x=" + radiuscentre.lng() +"&dist=" + $('#radiusdistance').val() + "&lower=" + $('#piiSliderMin').text() + "&upper=" + $('#piiSliderMax').text()
        window.location = urlparams;
        return;
    }else if(selectionpolygon!=null) {
        var polygon=null;
        polygon = getPointsFromPolygon(selectionpolygon);
        //urlstr='pg_export_to_excel.php';
        urlparams=urlstr + "?polygon=" + polygon + "&lower=" + $('#piiSliderMin').text() + "&upper=" + $('#piiSliderMax').text();  //+ "&polygon=" + escape(radiusstr);
        window.location = urlparams;
        return;
    }else{
        //urlstr='pg_export_to_excel.php';
        urlparams=urlstr + '?y1=' + map.getBounds().getSouthWest().lat() +'&x1=' + map.getBounds().getSouthWest().lng() +'&y2=' + map.getBounds().getNorthEast().lat() + '&x2=' + map.getBounds().getNorthEast().lng() + '&lower=' + $('#piiSliderMin').text() + '&upper=' + $('#piiSliderMax').text();
        window.location = urlparams;
    }
}


    
function reportToPDF(){
    //Create PDF Report
    var imageName="";
    $.ajax({
        url: "createmap.php", 
        data: {
            json: savemapstatetoJSON()
            }, 
        type:"POST",
        async: false,
        success: function(msg){
            //alert( "Data Saved: " + msg );
            imageName = $.trim(msg);
        }
    });
var link = "";
//alert(imageName);
//if ($('#summarybyradius').attr('checked')){
var polygon=null;
if (radiuspoly!=null) {
    //link += "pg_create_radius_pdf.php?cx="+radiuscentre.x+"&cy="+radiuscentre.y+"&dist="+$('#radiusdistance').val()+"&mapImage="+imageName;
    polygon=getPointsFromPolygon(radiuspoly);
    link +="pg_create_polygon_pdf.php?polygon="+ polygon +"&mapImage="+imageName;
}else if(selectionpolygon!=null) {
    
    polygon = getPointsFromPolygon(selectionpolygon);
    link +="pg_create_polygon_pdf.php?polygon="+ polygon +"&mapImage="+imageName;
}else{
    //y1=' + map.getBounds().getSouthWest().lat() +'&x1=' + map.getBounds().getSouthWest().lng() +'&y2=' + map.getBounds().getNorthEast().lat() + '&x2=' + map.getBounds().getNorthEast().lng()
    var x1=map.getBounds().getSouthWest().lng();
    var y1=map.getBounds().getSouthWest().lat();
    var x2=map.getBounds().getNorthEast().lng();
    var y2=map.getBounds().getNorthEast().lat();
    polygon = x1 + ' ' + y1 + ', ' + x1 + ' ' + y2 + ', ' + x2 + ' ' + y2 + ', ' + x2 + ' ' + y1 + ', ' + x1 + ' ' + y1;
    //link +="pg_create_pdf.php?llx="+ map.getBounds().getSouthWest().lng()+"&lly="+map.getBounds().getSouthWest().lat()+"&urx="+map.getBounds().getNorthEast().lng()+"&ury="+map.getBounds().getNorthEast().lat()+"&mapImage="+imageName;
    link +="pg_create_polygon_pdf.php?polygon="+ polygon +"&mapImage="+imageName;
}
link +="&minRemain="+$('#piiSliderMin').text()+"&maxRemain="+$('#piiSliderMax').text();
		
window.open(link);

 
}
    
function addThreat(){
    if ($('#threatprice').val()==''){
        alert('Enter a valid Price');
        $('#threatprice').focus();
        return false;
    }
    $("#defthreat").append('<tr><td class="ttype">' + $('#threattype').val() +'</td><td class="tprice">' + $('#threatprice').val() + '</td><td class="delete">&nbsp;<b>X</b>&nbsp;</td></tr>');
    $('#defthreat td').click(function(){
        $(this).parent().remove();
    });
    $('#defthreat td.delete').click(function(){
        $(this).parent().remove();
    });
    $('#defthreat td.delete b').hover(function() {
        $(this).css('cursor','pointer');
    }, function() {
        $(this).css('cursor','auto');
    });
    $('#threatprice').val('');
    $('#defthreat').show();
    return false;
}
    
function mortCalculate(deposit,multiplier){
    $('#mortresult').html('<img style="display: block; margin-left: auto; margin-right: auto;" src="images/wait30trans.gif" width="30" height="30" alt="loading">');
    var options=null;
    var pgurl= "pg_mortgagerate.php";
    if ((radiuspoly==null) && (selectionpolygon==null)) {
        options={
            y1:map.getBounds().getSouthWest().lat(),
            x1:map.getBounds().getSouthWest().lng(),
            y2:map.getBounds().getNorthEast().lat(),
            x2:map.getBounds().getNorthEast().lng(),
            deposit:deposit,
            multi:multiplier
        };
    }else{
        var polyStr=null;
        if(radiuspoly!=null){
            polyStr =getPointsFromPolygon(radiuspoly);
        }else{
            polyStr =getPointsFromPolygon(selectionpolygon)
        }
        options={
            polygon:escape(polyStr),
            deposit:deposit,
            multi:multiplier
        };
    }
    $.get(pgurl,options,function(data){
        $('#mortresult').html(data);
        $('#mortresult').css("background-image", "none");
    });
}
    
function playThreat(){
    if($('#defthreat tr').length==2){
        if ($('#threatprice').val()!=''){
            addThreat();
            playThreat();
        }else{
            alert('Add at least one Property Type and Price before running the Threat Score.');
        }
    }else{
        $('#threatresult').html('<img style="display: block; margin-left: auto; margin-right: auto;" src="images/wait30trans.gif" width="30" height="30" alt="loading">');
        var jsonStr = createThreatJson();
        var options=null;
        var pgurl= "pg_threatscore.php";
        if ((radiuspoly==null) && (selectionpolygon==null)) {
            options={
                y1:map.getBounds().getSouthWest().lat(),
                x1:map.getBounds().getSouthWest().lng(),
                y2: map.getBounds().getNorthEast().lat(),
                x2:map.getBounds().getNorthEast().lng(),
                json:jsonStr
            };
        }else{
            var polyStr=null;
            if(radiuspoly!=null){
                polyStr =getPointsFromPolygon(radiuspoly);
            }else{
                polyStr =getPointsFromPolygon(selectionpolygon)
            }
            options={
                polygon:escape(polyStr),
                json:jsonStr
            };
        }
        $.get(pgurl,options,function(data){
            $('#threatresult').html(data);
            $('#threatresult').css("background-image", "none");
        });
    }
      
}
    
function createThreatJson(){
    var jsonstr='{"threat":{"homes": [';
    $('#defthreat .ttype').each(function()
    {
        jsonstr+= '{"type":"' + $(this).html() + '","price": "' + $(this).parent().find("td:eq(1)").text() + '"},';
    });
    //Remove last string
    var strLen = jsonstr.length; 
    jsonstr = jsonstr.slice(0,strLen-1); 
    jsonstr+=']';
    jsonstr+=',"weights": [{"aw": ' + $("[name=ts_aw]").val() + ',"dog": ' + $("[name=ts_dog]").val() + ',"devstall": ' + $("[name=ts_ds]").val() + ',"notstart": ' + $("[name=ts_ns]").val() + ',"zoned": ' + $("[name=ts_z]").val() + ',"reccomplete": ' + $("[name=ts_rc]").val() + '}]';
    jsonstr+='}}';
    return jsonstr;
}
    
function getSelecteTab(){
    return $("#tabs").tabs( "option", "selected" );
}
function log(event_type,event_details) {
    $.get("log.php", {
        e: event_type, 
        i: event_details
    } );
}
function searchPlanning(keywords,pgnum,bounds){
    log('search',escape(keywords));
    $('#loading').show();
    if (searchMarker!=null){
        //map.removeOverlay(searchMarker);
        searchMarker.setMap(null);
    }
    var options=null;
    if($('#searchextent').attr('checked')){
        if (bounds==null){
            var bd = map.getBounds();
            bounds=bd.getSouthWest().lng()+',' + bd.getSouthWest().lat() + ',' + bd.getNorthEast().lng() + ',' + bd.getNorthEast().lat();
        }
        options  = {
            kwd:escape(keywords),
            pg:pgnum,
            offset:0,
            bounds:bounds
        };
    }else{
        options = {
            kwd:escape(keywords),
            offset:0,
            pg:pgnum
        };
    }
    $.post("pg_app_search.php",options,function(data){
        if(data=='none'){
            $('#planningSearchResults').html('<h4>No records returned for: \'' + keywords + '\'</h4>');
            $('#loading').hide();
            $('#clearPlanningSearch').attr('disabled', true);
        }else{
            $('#planningSearchResults').html(data);
            if(getSelecteTab()!=6){
                $('#tabs').tabs('select', '#tabs-5');
                $('#planningSearch').val(keywords); 
            } 
            $('#searchaccordion').accordion({
                header: "h3",
                autoHeight: false,
                collapsible: true,
                active:false,
                change: function() {
                    checkToRemoveMarker();
                }
            });
        $( "#searchaccordion").bind( "accordionchange", function(event, ui) {
            if($("#searchaccordion").accordion("option", "active")!==false){
                $(this).find('.appid').each(function(index) {
                    if($("#searchaccordion").accordion("option", "active")==index){
                        loadPlanningLink(index,$(this).text());
                    }
                });
            }
        });
        loadAllMarkers();
        $('#clearPlanningSearch').removeAttr('disabled')
        $('#loading').hide();
        $('#searchsummary').html($('#search_summary').html());
        $('#searchsummary').show();
    }			
			
});
}
  
  
function loadPlanningLink(appIndex,appRef){
    $('#searchaccordion').find('.applink').each(function(index) {
        if(appIndex==index){
            var pgurl="planning_docs_available.php?appNumber=" + appRef;
            $(this).load(pgurl,function(){ });
        }
    });
}
function viewAppOnMap(lng,lat,id){
    var point = new google.maps.LatLng(lat,lng);
    if (searchMarker!=null){
        searchMarker.setMap(null);
    }
    var mi = new google.maps.MarkerImage("images/target.png",new google.maps.Size(32,32),new google.maps.Point(0, 0),new google.maps.Point(16,16));  
    searchMarker=new google.maps.Marker({position: point, map: map, icon: mi});
    searchMarker.setMap(map);
    map.setCenter(point);
    map.setZoom(15);
    return false;
}
  
function checkToRemoveMarker(){
    if(isNaN(parseInt($("#searchaccordion").accordion("option", "active"),10))){
        if (searchMarker!=null){
            searchMarker.setMap(null);
            //map.removeOverlay(searchMarker);
        }
    }
}
  
function clearSearchResults(){
    clearAllMarkers();
    //Clear Results
    $('#searchsummary').html('');
    $('#searchsummary').hide();
    $('#planningSearchResults').html('');
    $('#clearPlanningSearch').attr('disabled', true);
}
function clearAllMarkers(){
    if (appMarkers.length>0){
        for ( var i = 0; i < appMarkers.length; i++ )
        {
            appMarkers[i].setMap(null);
        }
        appMarkers=new Array();	
    }
}
  
function loadAllMarkers(){
    //Remove previous Markers
    clearAllMarkers();
    $('.hide').each(function(index) {
        createMarker($(this).text(),index);
    });
    var latlngbounds = new google.maps.LatLngBounds();
    for ( var i = 0; i < appMarkers.length; i++ )
    {
        latlngbounds.extend(appMarkers[i].getPosition());
    }
    map.fitBounds(latlngbounds);
    if(map.getZoom()>15){map.setZoom(15);}
}
  
function createMarker(latlngStr, index) {
    var pts= latlngStr.split(",",2);
    var point = new google.maps.LatLng(pts[1],pts[0]);  		
    //var Marker = new GMarker(point, getMarker());
    var mi = new google.maps.MarkerImage("images/target.png",new google.maps.Size(32,32),new google.maps.Point(0, 0),new google.maps.Point(16,16));  
    appMarkers[index]=new google.maps.Marker({position: point, map: map, icon: mi});
    //map.addOverlay(appMarkers[index]);
    appMarkers[index].setMap(map);
    google.maps.event.addListener(appMarkers[index], "click", function(event) {
        $("#searchaccordion").accordion( "activate" , index );//(index);
    });
}	

function addLocalSales()
{
    if (localSales!=null){clearLocalSales();}
    localSales = new Array();
    var i=-1;
    var saletype=$("input[name='areasales']:checked").val(); // 1: Solds Only, 2: Solds & Sale Agreed
    var options=null;
    if ((radiuspoly==null)&&(selectionpolygon==null)){
       options={y1: map.getBounds().getSouthWest().lat(),x1:map.getBounds().getSouthWest().lng(),y2: map.getBounds().getNorthEast().lat(),x2:map.getBounds().getNorthEast().lng(),stype:saletype};
    }else {
        var polystr=null;
        if(radiuspoly==null){
            polystr=getPointsFromPolygon(selectionpolygon);
        }else{
            polystr=getPointsFromPolygon(radiuspoly);
        }
	options={polygon:escape(polystr),stype:saletype};
    }
    $.post("pg_getSolds.php",options,
        function(data){
            for (i=0; i<data.length; i++){
                createSalesMarker(data[i],i);
            }
            $("#asales").text(data.length);
        }
        
    );
    return false;
}

function createSalesMarker(sale,index){
    point = new google.maps.LatLng(sale.y,sale.x);
    mi = new google.maps.MarkerImage("images/markers/" + sale.style + ".png",new google.maps.Size(32,37),new google.maps.Point(0, 0),new google.maps.Point(16,16));
    localSales[index]=new google.maps.Marker({position: point, map: map, icon: mi,title:sale.title,clickable:true});
    localSales[index].setMap(map);
    google.maps.event.addListener(localSales[index], "click", function(event) {
         loadPropertyData(sale.y,sale.x,sale.title); 
    });
    return false;
}
function clearLocalSales(){
    $("#asales").text("0");
    for (var i=0; i<localSales.length; i++){
        localSales[i].setMap(null);
    }
    localSales=null;
}

function showLocalSales(maxZoom){
    if ($('#showareasales').attr('checked') && map.getZoom()>=maxZoom){
            $('.spanasales').show();
            addLocalSales();
    }else{
        if (localSales!=null){clearLocalSales();$('.spanasales').hide();}
    }
    return false;
}

//Load Modal Property Dialog
function loadPropertyData(y,x,title){
     var saletype=$("input[name='areasales']:checked").val(); // 1: Solds Only, 2: Solds & Sale Agreed
    $.get("pg_getSaleInfo.php",{y:y,x:x,stype:saletype},function(html){
        $("#propertypalinfo").html(html);
        $("#soldinfoaccordion").accordion({header: "h3",
        autoHeight: false,
        collapsible: true});
        if ($("#soldinfoaccordion h3").length>1){
            title= $("#soldinfoaccordion h3").length + " properties returned.";
        }
        $("#propertypalinfo").dialog({minHeight: 400,maxHeight: 750,height:600,width: 500,title:title,modal: true});
        
    });
}

function showLegend()
{
    var legendname=getLegendName();
    $("#" + legendname).fadeIn("fast");
    positionlegend(legendname);
    //$("#saleslegenddetails").fadeIn("fast");positionlegend();}).mouseout(function(){setTimeout( function(){$("#saleslegenddetails").fadeOut('fast')}, 1000 );
    //$("#" + legendname).fadeIn("fast");positionlegend();}).mouseout(function(){setTimeout( function(){$("#saleslegenddetails").fadeOut('fast')}, 1000 );
}

function hideLegend()
{
    var legendname=getLegendName();
    //setTimeout( function(){$("#" + legendname).fadeOut('fast')}, 1000); 
    $("#" + legendname).fadeOut('fast');
}

function getLegendName(){
    var legendname=null;
    if ($('#showareasales').attr('checked')){
        legendname="saleslegenddetails";
    }else{
        legendname="maplegenddetails";
    }
    return legendname;
}
//#mapout
$("#resizemap").live("click", function () {
        enlargeMap();
    });

function enlargeMap() {
    var center = map.getCenter();
    $("#dlgmap").dialog({
        height: $(window).height() - 150,
        width: $(window).width() - 150,
        modal: true,
        resizable: false,
        draggable: false,
        closeText: 'close',
        closeOnEscape: true,
        title: 'Pii Map',
        open: function (event, ui) {
            $('#piimap').height($("#dlgmap").height() - 50);
            $('#piimap').width($("#dlgmap").width() - 10);
            $('#dlgmap').append($('#mapbox'));
            $('.tsinput').hide();
            resizeandCenter(center);
        },
        close: function (event, ui) {
            $('#piimap').height('362px');
            $('#piimap').width('460px');
            $('#lh-col').prepend($("#mapbox"));
            $('.tsinput').show();
            resizeandCenter(center);
        }
    });
    return false;
}

function resizeandCenter(center) {
    google.maps.event.trigger(map, 'resize');
    map.setCenter(center);
}
