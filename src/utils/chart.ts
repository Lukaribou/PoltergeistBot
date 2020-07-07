export class QuickChart {
    chart: any;
    bkgColor: string;

    constructor() {
        this.chart = {
            type: '',
            data: {
                labels: [],
                datasets: []
            }
        };
        this.bkgColor = '#FFFFFF';
    }

    /**
     * Change le type du graphique
     * @param type Type de graphique
     */
    public setType(type: string): QuickChart {
        this.chart.type = type;
        return this;
    }

    /**
     * Change les labels sur l'axe des abscisses
     * @param lbls Les labels à afficher
     */
    public setXLabels(lbls: any[]): QuickChart {
        this.chart.data.labels = lbls;
        return this;
    }

    /**
     * 
     * @param lbl Label à associer
     * @param dt Les données
     * @param opt Des options (facultatif)
     */
    public addData(lbl: string, dt: any[], opt?: any): QuickChart {
        var data = {
            label: lbl,
            data: dt
        };
        for (let k in opt) {
            Object.defineProperty(data, k, {
                value: opt[k],
                enumerable: true
            });
        }
        this.chart.data.datasets.push(data);
        return this;
    }

    /**
     * Change la couleur de fond
     * @param clr Couleur du fond
     */
    public setBackgroundColor(clr: string): QuickChart {
        this.bkgColor = clr;
        return this;
    }

    /**
     * Change la couleur du texte
     * Ecrase les options
     * @param clr Couleur du texte
     */
    public setTextColor(clr: string): QuickChart {
        Object.defineProperty(this.chart, "options", {
            enumerable: true,
            value: {
                legend: {
                    labels: {
                        fontColor: clr
                    }
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            fontColor: clr
                        },
                    }],
                    xAxes: [{
                        ticks: {
                            fontColor: clr
                        },
                    }]
                }
            }
        });
        return this;
    }

    /**
     * Change les options du graphique
     * Ecrase les options
     * @param opts Les options
     */
    public setChartOptions(opts: any): QuickChart {
        Object.defineProperty(this.chart, "options", {
            enumerable: true,
            value: opts
        });
        return this;
    }

    /**
     * Génère l'URL
     */
    public generateUrl(): string {
        this.chart = JSON.stringify(this.chart);

        const ret = new URL('https://quickchart.io/chart');
        ret.searchParams.append('c', this.chart);
        ret.searchParams.append('w', '500'); // width
        ret.searchParams.append('h', '300'); // height
        ret.searchParams.append('bkg', this.bkgColor);

        return ret.href;
    }
}