
const {uriLooksSafe} = require('@portabletext/to-html');
const htm=require('htm');
const vhtml = require('vhtml');
const {urlFor} = require('../utils/client');
const html = htm.bind(vhtml);
var options = { year: 'numeric', month: 'long', day: 'numeric' };
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const dateString = (date)=>{
    const newDatw = new Date(date)
    return newDatw.toLocaleString("en-US",options)
}
const myPortableTextComponents = {
    types: {
      image: ({value}) => html`<img src="${String(urlFor(value))}" />`,
      callToAction: ({value, isInline}) =>
        isInline
          ? html`<a href="${value.url}">${value.text}</a>`
          : html`<div class="callToAction">${value.text}</div>`,
    },
  
    marks: {
      link: ({children, value}) => {
         
        // ⚠️ `value.href` IS NOT "SAFE" BY DEFAULT ⚠️
        // ⚠️ Make sure you sanitize/validate the href! ⚠️
        const href = value.href || ''
  
        if (uriLooksSafe(href)) {
          const rel = href.startsWith('/') ? undefined : 'noreferrer noopener'
         
          return html`<a href="${href}" class="blockContentA" rel="${rel}">${children}</a>`
        }
  
        // If the URI appears unsafe, render the children (eg, text) without the link
        return children
      },
      strong:({children,value})=>{
          return html `<strong>${children}</strong>`
      }
    },
  }
module.exports = {dateString,myPortableTextComponents}