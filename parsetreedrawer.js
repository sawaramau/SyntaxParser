const d3node = require('d3-node');
const fs = require("fs");
const render = require('svgexport');

class drawer {
    constructor(calculator) {
        this.d3 = new d3node();
        const d3 = this.d3.d3;
        this.yoffset = 100;
        this.xoffset = 100;
        this.r = 40;
        this.margin = 90;
        this.dmargin = 150;
        this.edger = 30;
        this.trees = calculator.trees;
        this.src = this.trees.map(v => v.allnodes).reduce((acc, v) => { v.map(v => {acc.push(v); acc.push(v.dummychild);}); return acc; }, []).filter(v => v);
        this.maxwidth = this.src.length + 2;
        this.maxdepth = 0;

        const setdepth = (node, depth = 0, parent = undefined) => {
            if (this.maxdepth < depth) {
                this.maxdepth = depth;
            }
            if (parent) {
                node.meta.phorizonal = parent.horizonal;
                node.meta.porder = node.horizonal < parent.horizonal ? 1 : -1;
            }
            if (node.starter == node) {
                node.meta.pdepth = depth - 1;
            } else {
                node.meta.pdepth = depth;
            }
            node.meta.depth = depth;
            node._tmpparent = parent;
            node.allchildren.map(v =>
            {
                setdepth(v, depth + 1, node)
            });
            node.allchildtrees.map(v => {
                setdepth(v, depth + 1, node)
            });
            if (node.nexter) {
                setdepth(node.nexter, depth, node);
            }
            if (node.dummychild) {
                node.dummychild.horizonal = node.horizonal - 0.5;
                setdepth(node.dummychild, depth + 1, node);
            }
        }

        this.trees.map(tree => {
            setdepth(tree, 0);
        });

        const yoffset   = this.yoffset;
        const xoffset   = this.xoffset;
        const r         = this.r;
        const margin    = this.margin;
        const dmargin   = this.dmargin;
        const edger = Math.min(this.edger, dmargin / 2);
        const width = (this.maxwidth + 2) * (r * 2 + margin) + this.xoffset;
        const height = (this.maxdepth + 2) * (r * 2 + dmargin) + this.yoffset;

        this.svg = this.d3.createSVG();
        this.svg.attr('width', width);
        this.svg.attr('height', height).attr('font-family', 'sans-serif').attr('font-size', '14px');

        const drawbracket = () => {
            this.bracket = this.svg.selectAll('body').data(this.src.filter(n => {
                if (n._parent && !n.nexter) {
                    return true;
                }
                return false;
            })).enter()
                .append('g')
                .append('svg')
                .attr('width', d => (d.horizonal - d.starter.horizonal) * (r * 2 + margin))
                .attr('x', d => d.starter.horizonal * (r * 2 + margin) + xoffset + r)
                .attr('height', '100%')
                .attr('y', d => d.meta.depth * (r * 2 + dmargin) + yoffset + r);
            this.bracket.append('line')
                .attr('x1', 0)
                .attr('x2', '100%')
                .attr('y1', 0)
                .attr('y2', 0)
                .attr('stroke-width', 4)
                .attr('stroke-dasharray', '15 6 3 6 ')
                .attr('stroke', 'black');
            this.bracket.append('line')
                .attr('x1', 0)
                .attr('x2', 0)
                .attr('y1', dmargin / 2)
                .attr('y2', '100%')
                .attr('stroke-width', 4)
                .attr('stroke-dasharray', '15 6 3 6 ')
                .attr('stroke', 'black');
            this.bracket.append('line')
                .attr('x1', '100%')
                .attr('x2', '100%')
                .attr('y1', dmargin / 2)
                .attr('y2', '100%')
                .attr('stroke-width', 4)
                .attr('stroke-dasharray', '15 6 3 6 ')
                .attr('stroke', 'black');
        }

        const drawedge = () => {
            const line = (d) => {

                const hmin = Math.min(d.horizonal, d.meta.phorizonal);
                const hmax = Math.max(d.horizonal, d.meta.phorizonal);
                const dmin = Math.min(d.meta.depth, d.meta.pdepth);
                const dmax = Math.max(d.meta.depth, d.meta.pdepth);
                const xmin = (2 * r + margin) * hmin;
                const xmax = (2 * r + margin) * hmax;
                const ymin = (2 * r + dmargin) * dmin
                const ymax = (2 * r + dmargin) * dmax;
                return d3.line()
                    .x(d => {
                        const result = d3.scaleLinear().domain(
                            [
                                hmin, hmax
                            ]
                        ).range([0, xmax - xmin])(d[0]);
                        return result + d[2];
                    })
                    .y(d => {
                        const result = d3.scaleLinear().domain(
                            [
                                dmin, dmax
                            ]
                        ).range([0, ymax - ymin])(d[1]);
                        return result + d[3];
                    });
            }
            this.edges = this.svg.selectAll('body').data(this.src).enter()
                .append('g')
                .append('svg')
                .attr('width', d => (2 * r + margin) * Math.abs(d.horizonal - d.meta.phorizonal))
                .attr('x',     d => Math.min(d.horizonal, d.meta.phorizonal) * (r * 2 + margin) + xoffset + r)
                .attr('height', d => ((2 * r + dmargin) * (Math.abs(d.meta.depth - d.meta.pdepth)) - 2 * r))
                .attr('y',      d => Math.min(d.meta.depth - 1 / 2, d.meta.pdepth + 1 / 2) * (r * 2 + dmargin) + yoffset - dmargin / 2 + r)
                .attr('class', 'edge');
            this.edges.append('path')
                .attr('stroke-dasharray', d => {
                    if (d.define.order == -1) {
                        return '10 30';
                    }
                    return 0;
                })
                .attr('fill-opacity', 0)
                .attr('stroke-width', 4)
                .attr('stroke', 'black')
                .attr('d', d => line(d)([[d.meta.phorizonal, d.meta.pdepth, 0, 0], [d.meta.phorizonal, d.meta.pdepth, - d.meta.porder * edger, edger], [d.horizonal, d.meta.pdepth, d.meta.porder * edger, edger], [d.horizonal, d.meta.pdepth, 0, edger * 2], [d.horizonal, d.meta.depth, 0, 0]]))
        };
        const drawop = () => {
            this.operators = this.svg.selectAll('body').data(this.src).enter()
                .append('g')
                .append('svg')
                .attr('width', 2 * r)
                .attr('height', 2 * r)
                .attr('x', d => d.horizonal * (r * 2 + margin) + xoffset)
                .attr('y', d => d.meta.depth * (r * 2 + dmargin) + yoffset)
                .attr('class', 'operator')
                .attr('width', 2 * r);
            this.operators.append('circle')
                .attr('r', '50%')
                .attr('cx', '50%')
                .attr('cy', '50%')
                .style('fill', d => {
                    if (d.meta.dummy) {
                        return '#66eeff';
                    } else if (d.define.order === -1) {
                        return '#77eeff';
                    } else if (d._parent) {
                        if (d.nexter) {
                            return '#77ff77';
                        } else {
                            return '#ff7777';
                        }
                    } else if (d.priority < 3) {
                        return '#ff4444';
                    } else if (d.nexter) {
                        return '#7777ff'
                    }
                    return 'green'
                });
            this.operators.append('text')
                .attr('x', '50%')
                .attr('y', '70%')
                .attr('width', '50%')
                .attr('text-anchor', 'middle')
                .text(d => {
                    if (d.meta.dummy) {
                        return 'dummy';
                    }
                    return d.first
                })
                .style('fill', 'white');
            this.operators.append('text')
                .attr('x', '50%')
                .attr('y', '40%')
                .attr('width', '100%')
                .attr('text-anchor', 'middle')
                .text(d => d.horizonal)
                .style('fill', 'white');
        };
        drawbracket();
        drawop();
        drawedge();
    }
    output(path = 'output.svg') {
        const data = this.d3.svgString();
        fs.writeFile(path, data, (err) => {
            return;
        });
    }
}

module.exports = {
    drawer
};
