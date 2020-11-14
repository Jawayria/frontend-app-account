import React from 'react';
import PropTypes from 'prop-types';
import { getConfig } from '@edx/frontend-platform';
import { injectIntl, intlShape, FormattedMessage } from '@edx/frontend-platform/i18n';

import messages from './IdVerification.messages';
import { ERROR_REASONS } from './IdVerificationContext';

function ErrorMessage({ error, intl }) {
  const handleMessage = () => {
    if (error === ERROR_REASONS.AUDIT) {
      return <p>{intl.formatMessage(messages['id.verification.error.audit'])}</p>;
    } else if (error === ERROR_REASONS.INACTIVE_COURSE) {
      return <p>{intl.formatMessage(messages['id.verification.error.inactive'])}</p>;
    } else if (error === ERROR_REASONS.EXISTING_REQUEST) {
      return <p>{intl.formatMessage(messages['id.verification.error.pending'])}</p>;
    }
    return (
      <FormattedMessage
        id="id.verification.error.denied"
        defaultMessage="You cannot verify your identity at this time. If you have yet to activate your account, please check your spam folder for the activation email from {email}."
        description="Text that displays when user is denied from making a request, and to check their email for an activation email."
        values={{
          email: <strong>no-reply@registration.edx.org</strong>,
        }}
      />
    );
  };

  return (
    <div>
      <h3 aria-level="1" tabIndex="-1">
        {intl.formatMessage(messages['id.verification.error.title'])}
      </h3>
      {handleMessage()}
      <div className="action-row">
        <a className="btn btn-primary mt-3" href={`${getConfig().LMS_BASE_URL}/dashboard`}>
          {intl.formatMessage(messages['id.verification.return.dashboard'])}
        </a>
      </div>
    </div>
  );
}

ErrorMessage.propTypes = {
  intl: intlShape.isRequired,
  error: PropTypes.string.isRequired,
};

export default injectIntl(ErrorMessage);
