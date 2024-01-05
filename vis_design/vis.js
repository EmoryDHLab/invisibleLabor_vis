const width = 4500;
const height = 2800;
const margin = { top: 200, right: 20, bottom: 50, left: 20 };
const referenceYear = 2023;
const svg = d3
    .select("body") 
    .append("svg")
    .attr("width", width)
    .attr("height", height)

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
    .html("<p>I'm a tooltip written in HTML</p><img src='https://github.com/holtzy/D3-graph-gallery/blob/master/img/section/ArcSmal.png?raw=true'></img><br>Fancy<br><span style='font-size: 40px;'>Isn't it?</span>");

const csvFile = "./data/labor_data_v2.csv";

function create_scale(d){
    xScale = d3
        .scaleTime()
        .domain([new Date(d.date.getFullYear(), 0, 1), new Date(d.date.getFullYear(), 11, 31)]) // January 1 to December 31 of the reference year
        .range([100+margin.left, width - margin.right]);
    return xScale(new Date(d.date.getFullYear(), d.date.getMonth(), d.date.getDate()))
}

function drawBarChart(data) {
    // Define dimensions for the bar chart
    const barChartWidth = 600;
    const barChartHeight = 500;
    const margins = { top: 10, right: 10, bottom: 30, left: 100 };

    // Adjusted width and height considering margins
    const adjustedWidth = barChartWidth - margins.left - margins.right;
    const adjustedHeight = barChartHeight - margins.top - margins.bottom;

    const xScale = d3.scaleBand()
                    .range([ 0, adjustedWidth ])
                    .domain(data.map(d => d.source))
                    .padding(0.2);

    const yScale = d3.scaleLinear()
                     .domain([0, 100])
                     .range([adjustedHeight, 0]);

    // Create an SVG element for the bar chart
    const barSvg = d3.create("svg")
                     .attr("width", barChartWidth)
                     .attr("height", barChartHeight);
     // Add X axis
    barSvg.append("g")
          .attr("transform", "translate(30," + (adjustedHeight + 20) + ")")
          .call(d3.axisBottom(xScale));

    // Add Y axis
    barSvg.append("g")
          .attr("transform", "translate(30,20)")
          .call(d3.axisLeft(yScale));
    // Create a scale for the bars
    

    // Add bars to the SVG
    barSvg.selectAll(".bar")
          .data(data)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", d => xScale(d.source)+30)
          .attr("y", d => yScale(d.count)+20)
          .attr("width", xScale.bandwidth())
          .attr("height", d => adjustedHeight - yScale(d.count))
          .attr("fill", "steelblue");

    return barSvg.node(); // Return the SVG node
}

d3.csv(csvFile).then(function (data) {

    // Convert the date and time strings to JavaScript Date objects
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
        d => d3.timeDay(d.timestamp), // Group by day
        d => d.source // Group by source
    );

    const sources = [...new Set(data.map(d => d.source))];

    // Create a new array to store the transformed data
    const transformedData = [];

    // Iterate through each day and source
    groupedData.forEach((value, day, sources) => {
        const dayEntry = {date: day, sources: [], "total": 0, "clicked": false};
        dayEntry["sources"].push({"source": "Github", "count": 0});
        dayEntry["sources"].push({"source": "Zotero", "count": 0});
        dayEntry["sources"].push({"source": "Google Drive", "count": 0});
        dayEntry["sources"].push({"source": "iCalendar", "count": 0});
        value.forEach((count, sourceName) => {
            source_obj = dayEntry.sources.find(source => source.source === sourceName).count = count
            dayEntry["total"] += count;
        });

        transformedData.push(dayEntry);
    });


    const color = d3.scaleOrdinal(d3.schemeCategory10);

    var stackedData = d3.stack().keys(sources)(transformedData)



    const countsByDate = Array.from(dataByDate, ([date, records]) => ({ date, count: records.length }));
    // Calculate the x-coordinate positions for each year
    const yScale = d3
        .scaleTime()
        .domain([d3.max(data, (d) => new Date(d.timestamp.getFullYear(), 0, 1)), d3.min(data, (d) => new Date(d.timestamp.getFullYear(), 0, 1))])
        .range([margin.top, height - margin.bottom]);

    const yScale_opp = d3
        .scaleTime()
        .domain([d3.min(data, (d) => new Date(d.timestamp.getFullYear(), 0, 1)),d3.max(data, (d) => new Date(d.timestamp.getFullYear(), 0, 1))])
        .range([margin.top, height - margin.bottom]);

    const stacked_yScale = d3.scaleLinear()
        .domain([0,d3.max(stackedData, d => d3.max(d, d=> d[1]))])
        .range([0,200]);

    const opacityScale = d3.scaleLinear()
        .domain([0,d3.max(transformedData, (d) => d.total)])
        .range([0,1]);

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

    // Assuming d3 has been imported

    // Define the range of data values for your heatmap
    const minValue = d3.min(transformedData, d => d.total); // Replace with your actual min data value
    const maxValue = d3.max(transformedData, d => d.total); // Replace with your actual max data value

    // Create a sequential color scale
    const colorScale = d3.scaleSequential()
        .domain([minValue, maxValue])
        .range(["#ffffe0", "#00429d"]); // This is an example, you can choose any interpolator


    // Create an x-axis for each year
    yearAxes.each(function (year) {
        const xScaleYear = d3.scaleTime()
            .domain([new Date(year, 0, 1), new Date(year, 11, 31)]) // January 1 to December 31 of the year
            .range([100 + margin.left, width - margin.right]);

        const xAxisYear = d3.axisBottom(xScaleYear)
            .tickFormat(d3.timeFormat("%b")) // Display abbreviated month names
            .tickSize(0) // Customize the tick size as needed
            .ticks(d3.timeMonth.every(1)); // Display a tick for every month

        d3.select(this).call(xAxisYear);
    });

    // svg.append("g")
    //     .selectAll("g")
    //     .data(stackedData)
    //     .join("g")
    //         .attr("fill", d => color(d.key))
    //     .selectAll("rect")
    //     .data(D => D)
    //     .join("rect")
    //     .attr("x", d => create_scale(d.data))
    //     .attr("transform", function (d) {
    //         return `translate(0, ${yScale(new Date(d.data.date.getFullYear(), 0, 1))})`;
    //     })
    //     .attr("y", d => stacked_yScale(d[0])-stacked_yScale(d[1]))
    //     .attr("height", d => stacked_yScale(d[1]-d[0]))
    //     .attr("width", function (d){
    //             return (width - 100 - margin.left - margin.right)/d3.timeDay.count(new Date(d.data.date.getFullYear(), 0, 1), new Date(d.data.date.getFullYear(), 11, 31))
    //         })

    svg.append("g")
        .selectAll("rect")
        .data(transformedData)
        .enter()
        .append("rect")
        .attr("stroke", "black")
        .attr("fill", d => colorScale(d.total)) 
        .attr("x", d => create_scale(d))
        .attr("transform", function (d) {
            return `translate(0, ${yScale(new Date(d.date.getFullYear(), 0, 1))})`;
        })
        .attr("y", function (d){
            return -(width - 100 - margin.left - margin.right)/d3.timeDay.count(new Date(d.date.getFullYear(), 0, 1), new Date(d.date.getFullYear(), 11, 31))
        })
        .attr("height", function (d){
            return (width - 100 - margin.left - margin.right)/d3.timeDay.count(new Date(d.date.getFullYear(), 0, 1), new Date(d.date.getFullYear(), 11, 31))
        })
        .attr("width", function (d){
                return (width - 100 - margin.left - margin.right)/d3.timeDay.count(new Date(d.date.getFullYear(), 0, 1), new Date(d.date.getFullYear(), 11, 31))
            })

    svg.selectAll("rect")
        .on("mouseover", function(event, d) {
            const barChart = drawBarChart(d.sources); // Assuming d.sources is the correct data
            tooltip.html(""); // Clear previous content
            tooltip.node().appendChild(barChart); // Append the bar chart SVG to the tooltip
            tooltip.style("visibility", "visible")
                   .style("top", (event.pageY + 10) + "px")
                   .style("left", (event.pageX + 10) + "px");
            console.log(tooltip)
        })
        .on("mouseout", function(event, d) {
            if (!d.clicked) {
                // Hide the tooltip only if it hasn't been clicked
                tooltip.style("visibility", "hidden");
            }
        })
        .on("click", function(event, d) {
            // Toggle the clicked state
            d.clicked = !d.clicked;
        });
        

    svg.append("g")
        .selectAll("text")
        .data(Array.from(dataByYear.keys()))
        .enter()
        .append("text")
        .attr("x", width - margin.right) 
        // Adjust the y-coordinate for label placement
        .attr("y", function (year) {
            return yScale(new Date(year, 0, 1)) - 50; // Shift the label down by 10 units
        })
        .text(function (year) {
        return year; // Display the year as the label
        })
        .attr("text-anchor", "end") // Anchor text to the end (right side) of the label
        .attr("font-size", 30) // You can customize the font size
        .attr("fill", "black")// You can customize the text color

        


});