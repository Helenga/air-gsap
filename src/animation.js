import {Schema} from "air-schema"
import {TimelineMax, TweenMax} from "gsap/all"
import { Observable } from "air-stream"

export default class Animation extends Observable {

    /**
     * [ "frame-name", { duration: (ms) }
     *      [ 0 (%), { x: 100 (px), y: 100 (px) } ], (optional)
     *      [ 20 (%), { x: 100 (px), y: 200 (px) } ],
     *      [ 100 (%), { x: 200 (px), y: 100 (px) } ],
     * ]
     * @param schema
     * @param ttmp
     * @param time
     * @param state
     * @param complete
     */

    constructor(gr, { frames }) {
        super( () => {

            const _cache = [];
            const _schema = new Schema(frames);

            return ( { dispose, data: [ schema, { time = performance.now(), ttmp = time, state = "play" } ] } = {} ) => {
                if(dispose) {
                    _cache.map( ([_, tl]) => tl.kill() );
                }
                else {
                    const from = (time - ttmp) / 1000;
                    const [ name, { duration, delay }, ...keys ] = this.frames.find(schema[0]).merge(schema).toJSON();
                    const startAt = keys[0] && keys[0][0] === 0 ? keys.shift()[1] : {};
                    const existIndex = this._cache.findIndex( (_, _name) => name === _name );
                    if(existIndex > -1) {
                        _cache[existIndex].kill();
                        _cache.splice(existIndex, 1);
                    }
                    if(state === "play") {
                        const tl = new TimelineMax({
                            delay: delay + (from < 0 ? -from : 0),
                            tweens: keys
                                .map(([to, props], i, arr) => [to - (arr[i - 1] ? arr[i - 1][0] : 0) / 100, props])
                                .map(([range, props]) => new TweenMax(this.gr, duration / range, {startAt, ...props})),
                            align: "sequence",
                            onComplete: complete
                        });
                        from < 0 ? tl.restart(true) : tl.seek(from, false);
                        _cache.push( [ name, tl ] );
                    }
                }
            }
        } );
    }

}