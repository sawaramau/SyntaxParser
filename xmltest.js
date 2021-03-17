const xml = require("./xmlparser.js");
const { drawer } = require('./parsetreedrawer.js');
const fs = require("fs");

fs.readFile("1.xml", "utf-8", (err, data) => {
    xml.code = data;
    const draw = new drawer(xml.parser);
    draw.output('xmltree.svg');
})
