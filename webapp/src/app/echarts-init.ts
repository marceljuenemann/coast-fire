import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { AxisPointerComponent, GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, AxisPointerComponent, CanvasRenderer]);

export { echarts };
