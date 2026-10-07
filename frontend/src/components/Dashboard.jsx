import {
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';

import {
    Responsive,
    WidthProvider
} from 'react-grid-layout';

import Widget from './Widget';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';


const ResponsiveGridLayout =
    WidthProvider(Responsive);


function Dashboard({
    widgets,
    onDelete,
    onSavePosition
}) {

    const [layouts, setLayouts] =
        useState({
            lg: []
        });

    const readyRef =
        useRef(false);


    const widgetMap =
        useMemo(
            () => new Map(
                widgets.map(
                    widget => [
                        String(widget.id),
                        widget
                    ]
                )
            ),
            [widgets]
        );


    useEffect(() => {

        const layout =
            widgets.map(widget => ({

                i: String(widget.id),

                x: widget.position_x,
                y: widget.position_y,

                w: widget.width,
                h: widget.height,

                minW: 2,
                minH: 2

            }));


        setLayouts({
            lg: layout
        });


        readyRef.current = true;

    }, [widgets]);


    function handleLayoutChange(
        currentLayout
    ) {

        setLayouts({
            lg: currentLayout
        });
    }


    async function handleDragOrResizeStop(
        currentLayout
    ) {

        if (!readyRef.current) {
            return;
        }


        await Promise.all(

            currentLayout.map(item => {

                const widget =
                    widgetMap.get(
                        String(item.i)
                    );

                if (!widget) {
                    return Promise.resolve();
                }


                return onSavePosition(
                    widget.id,
                    {
                        x: item.x,
                        y: item.y,
                        w: item.w,
                        h: item.h
                    }
                );

            })

        );
    }


    return (

        <ResponsiveGridLayout

            className="dashboard-grid"

            layouts={layouts}

            breakpoints={{
                lg: 1200,
                md: 996,
                sm: 768,
                xs: 480,
                xxs: 0
            }}

            cols={{
                lg: 12,
                md: 10,
                sm: 6,
                xs: 4,
                xxs: 2
            }}

            rowHeight={80}

            margin={[15, 15]}

            containerPadding={[0, 0]}

            isDraggable={true}

            isResizable={true}

            onLayoutChange={
                handleLayoutChange
            }

            onDragStop={
                handleDragOrResizeStop
            }

            onResizeStop={
                handleDragOrResizeStop
            }

        >

            {widgets.map(widget => (

                <div
                    key={String(widget.id)}
                >

                    <Widget
                        widget={widget}
                        onDelete={onDelete}
                    />

                </div>

            ))}

        </ResponsiveGridLayout>

    );
}


export default Dashboard;