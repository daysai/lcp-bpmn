import { terser } from 'rollup-plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from 'rollup-plugin-json';
import replace from 'rollup-plugin-replace';

const outputDir = 'dist';

const distros = [
  {
    input: 'Viewer',
    output: 'bpmn-viewer'
  },
  {
    input: 'NavigatedViewer',
    output: 'bpmn-navigated-viewer'
  },
  {
    input: 'Modeler',
    output: 'bpmn-modeler'
  }
];

const configs = distros.reduce(function(configs, distro) {
  const {
    input,
    output
  } = distro;

  return [
    ...configs,
    {
      input: `./lib/${input}.js`,
      output: {
        name: 'BpmnJS',
        file: `${outputDir}/${output}.development.js`,
        format: 'umd'
      },
      plugins: pgl([
      ])
    },
    {
      input: `./lib/${input}.js`,
      output: {
        name: 'BpmnJS',
        file: `${outputDir}/${output}.production.min.js`,
        format: 'umd'
      },
      plugins: pgl([terser()])
    }
  ];
}, []);

export default configs;


// helpers //////////////////////

function pgl(plugins=[]) {
  return [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    nodeResolve({
      mainFields: [
        'browser',
        'module',
        'main'
      ]
    }),
    commonjs(),
    json(),
    ...plugins
  ];
}
