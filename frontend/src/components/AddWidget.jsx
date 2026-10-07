function AddWidget({ onAdd }) {

    function handleAdd() {

        const widgetName = window.prompt(
            'Quel widget ajouter ?\n\n' +
            'distance\n' +
            'temperature\n' +
            'camera\n' +
            'buzzer'
        );

        if (!widgetName) {
            return;
        }

        onAdd(
            widgetName
                .trim()
                .toLowerCase()
        );
    }


    return (

        <button
            className="add-button"
            onClick={handleAdd}
        >
            + Ajouter un widget
        </button>

    );
}


export default AddWidget;