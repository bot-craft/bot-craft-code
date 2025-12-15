// components/generic/ItemSelector.js

const ItemSelector = ({ items, itemsName, icon: ItemIcon, onAdd, filterPlaceholder }) => {
    return (
        <>

        {/* Search box */}
            {/* style */}
            {/* logic */}
            {/* behaviour (ex is btn is tag) */}

        {/* List of items */}
            {/* style */}
            {/* logic */}
            {/* behaviour (ex is btn is tag) */}
            
            {/* buttons */}
                {/* styles */}
                    {/* icons */}
                    {/* etc ... */}
                {/* logic */}


        {items.map((item) => (
            <button key={item.id} onClick={() => onSelect(item)}>
            {item.name}
            </button>
        ))}
        </>
    );
};

export default ItemSelector;