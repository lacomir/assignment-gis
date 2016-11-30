const pg = require('pg');
const fs = require('fs');
const express = require('express');


var pool = new pg.Pool({
	user: 'postgres',
	password: 'VibWotDoha',
	host: 'localhost',
	database: 'postgis_sample',
	idleTimeoutMillis: 1000
});

var handlers = {};

exports.handleTestQuery = (request, response) => {
	var handler = request.url.substring(1);
	handlers[handler](request, response);
}

handlers['query-street-url'] = (request, response) => {
	pool.connect((err, client, done) => {
		var body = request.body;
		console.log(body);
		console.log(body.street);
		
		var queryString = `with min_distance_query_1 as (
							select min(st_distance(ST_MakePoint(x1, y1),ST_MakePoint(` + body.rest_lon + `, ` + body.rest_lat + `))) min_distance 
							from ways 
							where (class_id between 100 and 112 or class_id between 123 and 125 or class_id = 401) 
							and name = '` + body.street + `'
							)


							select source as id, ST_AsGeoJson(ST_MakePoint(x1, y1)) geojson from ways w, min_distance_query_1 where 
							st_distance(ST_MakePoint(x1, y1),ST_MakePoint(` + body.rest_lon + `, ` + body.rest_lat + `)) <= min_distance_query_1.min_distance and (class_id between 100 and 112 or class_id between 123 and 125 or class_id = 401) and w.name = '` + body.street + `' limit 1`;
		client.query(queryString, (err, result) => {
			console.log(result);
			done();
			console.log('done');
			response.set('Content-Type', 'text/plain');
			response.send(JSON.stringify(result));
		});
		
		
	});
}

handlers['query2-url'] = (request, response) => {
	pool.connect((err, client, done) => {
		var body = request.body;
		console.log(body);
		console.log(body.click_lon);
		console.log(body.click_lat);
		
		var queryString = `with min_distance_query_1 as (
								select min(st_distance(ST_MakePoint(x1, y1),ST_MakePoint( ` + body.click_lon + `, ` + body.click_lat + `))) min_distance 
								from ways 
								where class_id between 100 and 112 
								or class_id between 123 and 125 
								or class_id = 401
							)

							select source as id, ST_AsGeoJson(ST_MakePoint(x1, y1)) geojson 
							from ways w, min_distance_query_1 
							where st_distance(ST_MakePoint(x1, y1),ST_MakePoint( ` + body.click_lon + `, ` + body.click_lat + `)) <= min_distance_query_1.min_distance 
							and (w.class_id between 100 and 112 
							or w.class_id between 123 and 125 
							or w.class_id = 401) 
							limit 1`;
		console.log(queryString);					
		client.query(queryString, (err, result) => {
			console.log(result);
			done();
			console.log('done');
			response.set('Content-Type', 'text/plain');
			response.send(JSON.stringify(result));
		});
		
		
	});
}

handlers['query4-url'] = (request, response) => {
	
	var body = request.body;
	
	
	var i = 1;
	var parkingQueryBuilder = "";
	
	var parkingQueryBuilder = `with points` + i + ` as (
									select source, x1, y1 
									from ways 
									where source = ` + body.restaurant + `
									limit 1)`;
	
	body.deliveries.forEach(function(item){
		
		i++;
		
		parkingQueryBuilder += `,
								points` + i + ` as (
									select source, x1, y1 
									from ways 
									where source = ` + item + `
									limit 1)`;
	});
	
	
	i = 1;
	parkingQueryBuilder += `
							select * from
								(select pts.source, ST_AsGeoJson(ST_Transform(p.way, 4326)) ,ST_Distance(ST_Transform(p.way, 4326)::geography, ST_SetSRID(ST_MakePoint( pts.x1, pts.y1),4326)::geography) distance
								from planet_osm_point p, points` + i + ` pts
								where p.amenity = 'parking' order by distance limit 3) asas` + i + `
								
								`;
	
	body.deliveries.forEach(function(item){
		
		i++;
		
		parkingQueryBuilder += `
		
								union all
		
								select * from
									(select pts.source, ST_AsGeoJson(ST_Transform(p.way, 4326)) ,ST_Distance(ST_Transform(p.way, 4326)::geography, ST_SetSRID(ST_MakePoint( pts.x1, pts.y1),4326)::geography) distance
									from planet_osm_point p, points` + i + ` pts
									where p.amenity = 'parking' order by distance limit 3) asas` + i;
	});
	
	
	var tspQueryBuilder = "SELECT seq, id1, id2, round(cost::numeric, 2) AS cost FROM pgr_tsp('select id::integer, lon as x, lat as y from ways_vertices_pgr where id = " + body.restaurant + " ";
	
	body.deliveries.forEach(function(item){
		tspQueryBuilder += " or id = " + item;
	});
	
	tspQueryBuilder += " order by id', " + body.restaurant + ");";
	
	console.log(tspQueryBuilder);
	
	
	pool.connect((err, client, done) => {

		var routes = [(body.deliveries.length+2)];
	
		var finished = 0;
		var maxFinished = body.deliveries.length+1;
		function checkFinish() {
			finished++;
			if(finished === maxFinished)
				endHandler();
		}

		var tspResult;
		
		client.query(tspQueryBuilder, (err, result) => {
			
			console.log(result)
			tspResult = result;
			
			var iterator = 0;
			result.rows.forEach(function(row) {
				
				console.log("---------------------------------");
				console.log(body.deliveries.length);
				console.log(iterator);
				
				var srcId = result.rows[iterator].id2;
				var destId = iterator >= body.deliveries.length ? result.rows[0].id2 : result.rows[iterator+1].id2;
				
				console.log(srcId);
				console.log(destId);
				console.log("---------------");	

				var dijkstraString = `
				with cestys as (
					select row_number() over () as num, w.the_geom linestrings 
					from	(SELECT *
							FROM pgr_dijkstra(
									'select gid::integer as id, source::integer, target::integer, (cost/maxspeed_forward)::double precision as cost from ways where class_id between 100 and 112 or class_id between 123 and 125 or class_id = 401',
									` + srcId + `, ` + destId + `, false, false
						)) s
					left join ways w
					on w.gid = s.id2
					where w.the_geom is not null
				),

				oneLine as (
					select row_number() over () as num, ST_MakeLine(c.linestrings)::geography cesta 
					from cestys c
				),
				pumpy as (
					select row_number() over () as num, st_transform(p.way,4326) pumpa, p.name, st_Distance(o.cesta ,st_transform(p.way,4326)) distance 
					from planet_osm_point p, oneLine o 
					where st_Distance(o.cesta ,st_transform(p.way,4326)) < 100 
					and p.amenity = 'fuel'
				)

				select st_asGeoJson(c.linestrings) geojson, st_length(ol.cesta) totlength, st_asGeoJson(p.pumpa) geojsonPumpa, p.name namePumpa, p.distance distancePumpa 
				from cestys c 
				left outer join pumpy p 
				on p.num = c.num
				left outer join OneLine ol 
				on ol.num = c.num`;
				
				
				
				((x)=>{
					client.query(dijkstraString, (err, result) => {
						console.log("Writing path on " + x);
						routes[x] = result;
						checkFinish();
					}); 
				})(iterator);
				
				iterator++;
			});
		});
		
		
		
		
		function endHandler() {
			
			var pumpy = [];
			var totlength = 0;
			
			routes.forEach(function(objectRow) {
				//console.log(objectRow);
				objectRow.rows.forEach(function(item){
					//console.log(item)
					if(item.namepumpa != null) {
						var pumpa = {
							name : item.namepumpa,
							distance : parseInt(item.distancepumpa,10),
							geojson: item.geojsonpumpa
						}
						//console.log(pumpa);
						pumpy.push(pumpa);
					}
					
					if(item.totlength != null)
						totlength += item.totlength;
					
					delete item.namepumpa;
					delete item.distancepumpa;
					delete item.geojsonpumpa;
					
					console.log(item);
				});
				//console.log("--------------------------")
			});
			
			//console.log(routes);
			//console.log(result);
			//console.log(pumpy);
			
			console.log("-------------------------------------------------");
			console.log(parkingQueryBuilder);
			
			client.query(parkingQueryBuilder, (err, parkingResult) => {

				done();
				console.log('done');

				response.set('Content-Type', 'text/plain');
				response.send(JSON.stringify({ routes: routes, tsp: tspResult, pumpy: pumpy, parkings: parkingResult, totlength: (totlength/1000).toFixed(2) }));
				
			});
		}
		
	});

}


