import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { CheckBox } from '@edx/paragon';
import { DECLINED } from '../data/constants';

export const Checkboxes = (props) => {
  const {
    id,
    options,
    values,
    onChange,
  } = props;

  const [selected, setSelected] = useState(values);
  useEffect(() => {
    onChange(id, selected)
  }, [selected])

  const handleToggle = (value, option) => {
    // If the user checked 'declined', uncheck all other options
    if (value && option == DECLINED) {
      setSelected([DECLINED]);
      return;
    }

    // If option checked, make sure this option is in `selected` (and remove 'declined')
    if (value && !selected.includes(option)) {
      const newSelected = selected.filter(i => i !== DECLINED).concat(option);
      setSelected(newSelected);
    }

    // If unchecked, make sure this option is NOT in `selected`
    if (!value) {
      setSelected(selected.filter(i => i !== option));
    }
  }

  const renderCheckboxes = () => {
    return options.map((option, index) => {
      const isFirst = index == 0;
      const isChecked = selected.includes(option.value);
      return (
        <div key={index} className="checkboxOption">
          <CheckBox
            type="checkbox"
            id={option.value}
            name={option.value}
            value={option.value}
            checked={isChecked}
            autoFocus={isFirst}
            label={option.label}
            onChange={(value) => handleToggle(value, option.value)}
          />
        </div>
      )
    })
  }

  return (
    <div role="group">
      {renderCheckboxes()}
    </div>
  )
}

Checkboxes.propTypes = {
  id: PropTypes.string,
  options: PropTypes.array,
  values: PropTypes.array,
  onChange: PropTypes.func,
};

Checkboxes.defaultProps = {
  options: [],
  values: [],
}

export default Checkboxes;
