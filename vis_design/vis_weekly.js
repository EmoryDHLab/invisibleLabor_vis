const width = 2400;
const height = 1400;
const width_barSvg = 3000;
const height_barSvg = 1000;
const margin = { top: 100, right: 10, bottom: 25, left: 10 };
const referenceYear = 2023;
var clicked = false;
var clickedRect = false;
const highlight = { fill: '#ff6347', stroke: '#000', strokeWidth: 3, opacity: 1 };
const svg = d3
    .select("body") 
    .append("svg")
    .attr("width", width)
    .attr("height", height)

const barVisSvg = d3.select("body")
    .append("svg")
    .attr("width", width_barSvg) // Set the width of the SVG
    .attr("height", height_barSvg) // Set the height of the SVG
    .style("position", "absolute") // Use absolute positioning
    .style("left", "100px") // Position to the left
    .style("bottom", "100px"); // Position at the bottom

const hoverText = barVisSvg.append("text")
    .attr("x", 1000)  // Position it in the middle of the barSvg
    .attr("y", 25)  // Position it 20 units down from the top
    .attr("text-anchor", "middle")  // Center the text
    .style("font-size", "30px")  // Set the font size
    .style("fill", "black");  // Set the text color

const metainfoText_user = barVisSvg.append("text")
    .attr("x", 2000)  // Position it in the middle of the barSvg
    .attr("y", 250)  // Position it 20 units down from the top
    .attr("text-anchor", "left")  // Center the text
    .style("font-size", "40px")  // Set the font size
    .style("fill", "black");  // Set the text color

const metainfoText_message = barVisSvg.append("text")
    .attr("x", 2000)  // Position it in the middle of the barSvg
    .attr("y", 750)  // Position it 20 units down from the top
    .attr("text-anchor", "left")  // Center the text
    .style("font-size", "40px")  // Set the font size
    .style("fill", "black");  // Set the text color

const tooltip = d3
    .select("body") 
    .append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("width", "600px")
    .style("height", "800px")
const csvFile = "./data/labor_data_v3.csv";

function create_scale(d){
    xScale = d3
        .scaleTime()
        .domain([new Date(d.week.getFullYear(), 0, 1), new Date(d.week.getFullYear(), 11, 31)]) // January 1 to December 31 of the reference year
        .range([100+margin.left, width - margin.right - 100]);
    return xScale(new Date(d.week.getFullYear(), d.week.getMonth(), d.week.getDate()))
}

const colorRange = ['#ff6347', '#4682b4', '#3cb371', '#ffd700', '#6a5acd']; // This is a predefined array of 10 categorical colors

// Define the color scale

function drawBarChart(data, daily_data) {
    const margins = { top: 10, right: 10, bottom: 40, left: 100 };
    const event_size = 25

    // Adjusted width and height considering margins
    const adjustedWidth = width_barSvg - margins.left - margins.right;
    const adjustedHeight = height_barSvg - margins.top - margins.bottom;

    const filtered_data_days = daily_data.filter( d => d3.timeWeek(d.timestamp).toString() == data.week.toString());

    filtered_data_days.sort((a, b) => {
        if (a.source < b.source) return -1;
        if (a.source > b.source) return 1;
        return d3.ascending(a.timestamp, b.timestamp);
      });
      
      let currentSource = null;
      let order = 1;
      
      filtered_data_days.forEach(d => {
        if(d.source !== currentSource) {
          currentSource = d.source;
          order = 1;
        } else {
          order++;
        }
        
        d.source_order = order;
      });
      
    const sources = data.sources

    const colorScale = d3.scaleOrdinal()
        .domain(sources.map(d => d.source))
        .range(colorRange);

    const yScale = d3.scaleBand()
                     .domain(sources.map(d => d.source))
                     .range([adjustedHeight, 0]);

    // Add Y axis
    barVisSvg.append("g")
          .attr("transform", "translate(130,20)")
          .attr("class", "axis")
          .call(d3.axisLeft(yScale).tickSize(0))
          .select('.domain')
          .remove();
    

    barVisSvg.selectAll(".bar")
        .data(filtered_data_days)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => yScale(d.source)+110)
        .attr("x", function(d){
            return d.source_order*event_size+110
        })
        .attr("width", event_size)
        .attr("height", event_size)
        .attr("stroke", "yellow")
        .attr("fill", d => colorScale(d.source))
        .attr("rx", 2)
        .attr("ry", 2)
        .on("mouseover", function (event, d){
            d3.select(this)
                .transition()
                .duration(200)
                .style("fill", highlight.fill);
            console.log("here")
            const user_sentence = `User: ${d.user}`; ;
            const messgae_sentence = `Info: ${d.information}`;
            metainfoText_user.text(user_sentence);
            metainfoText_message.text(messgae_sentence);
         })
         .on("mouseout", function (event, d){
            d3.select(this)
            .transition()
            .duration(200)
            .style("fill", d => colorScale(d.source));
            metainfoText_user.text("");
            metainfoText_message.text("");
         })

}

d3.csv(csvFile).then(function (data) {

    // Convert the week and time strings to JavaScript Date objects
    data.forEach(function (d) {
        d.timestamp = d3.isoParse(d.timestamp);
    });

    const dataByYear = d3.group(data, function (d) {
        return d.timestamp.getFullYear();
    });

    const dataByDate = d3.group(data, function (d) {
        return new Date(d.timestamp.getFullYear(), d.timestamp.getMonth(), d.timestamp.getDate())
    });

    data.forEach(function (d) {
        d.timestamp = new Date(d.timestamp);
      });

    // Group the data by day and source, and count occurrences
    const groupedData = d3.rollup(
        data,
        v => v.length, // Count occurrences
        d => d3.timeWeek(d.timestamp), // Group by week
        d => d.source // Group by source
    );

    // Create a new array to store the transformed data
    const transformedData = [];
    const weeks = d3.timeWeek.range(new Date(2013, 0, 1), new Date(2023, 11, 31));

    // Iterate through each day and source
    groupedData.forEach((value, day, sources) => {
        const dayEntry = {week: day, sources: [], "total": 0, "clicked": false};
        dayEntry["sources"].push({"source": "Github", "count": 0});
        dayEntry["sources"].push({"source": "Zotero", "count": 0});
        dayEntry["sources"].push({"source": "Google Drive", "count": 0});
        dayEntry["sources"].push({"source": "iCalendar", "count": 0});
        dayEntry["sources"].push({"source": "Figma", "count": 0});
        value.forEach((count, sourceName) => {
            source_obj = dayEntry.sources.find(source => source.source === sourceName).count = count
            dayEntry["total"] += count;
        });

        transformedData.push(dayEntry);
    });

    var weeks_in_data = transformedData.map(d => d.week.toString())

    weeks.forEach( w => {
      if(!weeks_in_data.includes(w.toString())){
        const dayEntry = {week: w, sources: [], "total": 0, "clicked": false};
        dayEntry["sources"].push({"source": "Github", "count": 0});
        dayEntry["sources"].push({"source": "Zotero", "count": 0});
        dayEntry["sources"].push({"source": "Google Drive", "count": 0});
        dayEntry["sources"].push({"source": "iCalendar", "count": 0});
        dayEntry["sources"].push({"source": "Figma", "count": 0});
        transformedData.push(dayEntry);
      }
    })

    const countsByDate = Array.from(dataByDate, ([week, records]) => ({ week, count: records.length }));
    // Calculate the x-coordinate positions for each year
    const yScale = d3
        .scaleTime()
        .domain([d3.max(data, (d) => new Date(d.timestamp.getFullYear(), 0, 1)), d3.min(data, (d) => new Date(d.timestamp.getFullYear(), 0, 1))])
        .range([margin.top, height - margin.bottom]);

    // Calculate the maximum count of records
    const maxCount = d3.max(countsByDate, d => d.count);

    // Create a linear scale for the count of records, mapping [0, maxCount] to [0, 50]
    const height_offset = d3
        .scaleLinear()
        .domain([0, maxCount])
        .range([0,200]);

    const yearAxes = svg.selectAll(".year-axis")
        .data([2021, 2020, 2019, 2018, 2022, 2023, 2013, 2014, 2017, 2015, 2016])
        .enter()
        .append("g")
        .attr("class", "year-axis")
        .attr("transform", function (year) {
            return `translate(0, ${yScale(new Date(year, 0, 1))})`;
        });

    const minValue = d3.min(transformedData, d => d.total); // Replace with your actual min data value
    const maxValue = d3.max(transformedData, d => d.total); // Replace with your actual max data value

    const colorScale = d3.scaleSequential()
        .domain([minValue, maxValue])
        .range(["#1F432B", "#6CD064"]); 

    yearAxes.each(function (year) {
        const xScaleYear = d3.scaleTime()
            .domain([new Date(year, 0, 1), new Date(year, 11, 31)]) 
            .range([100 + margin.left, width - margin.right - 100]);

        const xAxisYear = d3.axisBottom(xScaleYear)
            .tickFormat(d3.timeFormat("%b")) // Display abbreviated month names
            .tickSize(0) // Customize the tick size as needed
            .ticks(d3.timeMonth.every(1)); // Display a tick for every month

        d3.select(this).call(xAxisYear);
    });

    svg.append("g")
        .selectAll("rect")
        .data(transformedData)
        .enter()
        .append("rect")
        .attr("stroke", "yellow")
        .attr("fill", d => colorScale(d.total)) 
        .attr("x", d => create_scale(d))
        .attr("transform", function (d) {
            return `translate(0, ${yScale(new Date(d.week.getFullYear(), 0, 1))})`;
        })
        .attr("y", function (d){
            return -(width - 100 - margin.left - margin.right)/d3.timeWeek.count(new Date(d.week.getFullYear(), 0, 1), new Date(d.week.getFullYear(), 11, 31))
        })
        .attr("height", function (d){
            return (width - 100 - margin.left - margin.right)/d3.timeWeek.count(new Date(d.week.getFullYear(), 0, 1), new Date(d.week.getFullYear(), 11, 31))
        })
        .attr("width", function (d){
                return (width - 100 - margin.left - margin.right)/d3.timeWeek.count(new Date(d.week.getFullYear(), 0, 1), new Date(d.week.getFullYear(), 11, 31))
            })

    svg.selectAll("rect")
        .on("mouseover", function(event, d) {
            var currentRect = d3.select(this);
            if(clickedRect != false){
                currentRect = clickedRect;
                d = currentRect.datum();
            }
            currentRect
            .transition()
            .duration(200)
            .style("fill", highlight.fill);
            barVisSvg.selectAll(".bar")
            .remove();
            barVisSvg.selectAll(".axis").remove();
            const sentence = `Contribution Activity: The week of ${d.week.getMonth()+1}/${d.week.getDate()}/${d.week.getFullYear()}`; 
            hoverText.text(sentence);
            drawBarChart(d, data); 
        })
        .on("mouseout", function(event, d) {
            if(clickedRect == false){
                d3.select(this)
                  .transition()
                  .duration(200)
                  .style("fill", colorScale(d.total));
                barVisSvg.selectAll(".bar").remove();
                barVisSvg.selectAll(".axis").remove();
                metainfoText_user.text("");
                metainfoText_message.text("");
                hoverText.text("");

            }
           
        })
        .on("click", function(event, d) {
            if(d.clicked){
                clickedRect = false;
            }else{
                if(clickedRect != false){
                    clickedRect
                        .transition()
                        .duration(200)
                        .style("fill", colorScale(d.total));

                }
                clickedRect = d3.select(this); 
                clickedRect
                .transition()
                    .duration(200)
                    .style("fill", highlight.fill);
                    barVisSvg.selectAll(".bar")
                    .remove();
                    barVisSvg.selectAll(".axis").remove();
                    const sentence = `Contribution Activity: The week of ${clickedRect.datum().week.getMonth()+1}/${clickedRect.datum().week.getDate()}/${clickedRect.datum().week.getFullYear()}`; 
                    hoverText.text(sentence);
                    drawBarChart(clickedRect.datum(), data);
            }
            d.clicked = !d.clicked;
        });
            
    svg.append("g")
        .selectAll("text")
        .data([2021, 2020, 2019, 2018, 2022, 2023, 2013, 2014, 2017, 2015, 2016])
        .enter()
        .append("text")
        .attr("x", width - margin.right) 
        // Adjust the y-coordinate for label placement
        .attr("y", function (year) {
            return yScale(new Date(year, 0, 1)) - 20; // Shift the label down by 10 units
        })
        .text(function (year) {
        return year; // Display the year as the label
        })
        .attr("text-anchor", "end") 
        .attr("font-size", 30) 
        .attr("fill", "black")

});