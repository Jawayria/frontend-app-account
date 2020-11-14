import React, { useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { sendTrackEvent } from '@edx/frontend-platform/analytics';
import { AppContext } from '@edx/frontend-platform/react';

import { hasGetUserMediaSupport } from './getUserMediaShim';
import { getExistingIdVerification, getEnrollment } from './data/service';
import PageLoading from '../account-settings/PageLoading';
import ErrorMessage from './ErrorMessage';

const IdVerificationContext = React.createContext({});

const MEDIA_ACCESS = {
  PENDING: 'pending',
  UNSUPPORTED: 'unsupported',
  DENIED: 'denied',
  GRANTED: 'granted',
};

const ERROR_REASONS = {
  AUDIT: 'audit',
  INACTIVE_COURSE: 'inactive_course',
  EXISTING_REQUEST: 'existing_request',
  CANNOT_VERIFY: 'cannot_verify',
};

function IdVerificationContextProvider({ children }) {
  const { search } = useLocation();
  const [existingIdVerification, setExistingIdVerification] = useState(null);
  const [facePhotoFile, setFacePhotoFile] = useState(null);
  const [idPhotoFile, setIdPhotoFile] = useState(null);
  const [idPhotoName, setIdPhotoName] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [mediaAccess, setMediaAccess] = useState(hasGetUserMediaSupport ?
    MEDIA_ACCESS.PENDING :
    MEDIA_ACCESS.UNSUPPORTED);
  const [canVerify, setCanVerify] = useState(true);
  const [error, setError] = useState('');
  const { authenticatedUser } = useContext(AppContext);

  const contextValue = {
    existingIdVerification,
    facePhotoFile,
    idPhotoFile,
    idPhotoName,
    mediaStream,
    mediaAccess,
    userId: authenticatedUser.userId,
    nameOnAccount: authenticatedUser.name,
    setExistingIdVerification,
    setFacePhotoFile,
    setIdPhotoFile,
    setIdPhotoName,
    tryGetUserMedia: async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setMediaAccess(MEDIA_ACCESS.GRANTED);
        setMediaStream(stream);
        // stop the stream, as we are not using it yet
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      } catch (err) {
        setMediaAccess(MEDIA_ACCESS.DENIED);
      }
    },
    stopUserMedia: () => {
      if (mediaStream) {
        const tracks = mediaStream.getTracks();
        tracks.forEach(track => track.stop());
        setMediaStream(null);
      }
    },
  };

  // Course run key is passed as a query string
  useEffect(() => {
    if (search) {
      sessionStorage.setItem('courseRunKey', search.substring(1));
    } else {
      sendTrackEvent('edx.id_verification.no_course_key', {
        category: 'id_verification',
      });
    }
  }, [search]);

  useEffect(() => {
    // Call verification status endpoint to check whether we can verify.
    (async () => {
      const existingIdV = await getExistingIdVerification();
      setExistingIdVerification(existingIdV);
    })();
    // If a course run key is provided, check whether it is in verified or audit mode.
    const courseRunKey = sessionStorage.getItem('courseRunKey');
    if (courseRunKey) {
      (async () => {
        const enrollment = await getEnrollment(courseRunKey);
        if (!enrollment.requiresVerification) {
          setCanVerify(false);
          setError(ERROR_REASONS.AUDIT);
        } else if (enrollment.isActive === false) {
          setCanVerify(false);
          setError(ERROR_REASONS.INACTIVE_COURSE);
        }
      })();
    }
  }, []);

  useEffect(() => {
    // Check for an existing verification attempt
    if (existingIdVerification && !existingIdVerification.canVerify) {
      const { status } = existingIdVerification;
      setCanVerify(false);
      if (status === 'pending' || status === 'approved') {
        setError(ERROR_REASONS.EXISTING_REQUEST);
      } else {
        setError(ERROR_REASONS.CANNOT_VERIFY);
      }
    }
  }, [existingIdVerification]);

  // If we are waiting for verification status endpoint, show spinner.
  if (!existingIdVerification) {
    return <PageLoading srMessage="Loading verification status" />;
  }

  if (!canVerify) {
    return <ErrorMessage error={error} />;
  }

  return (
    <IdVerificationContext.Provider value={contextValue}>
      {children}
    </IdVerificationContext.Provider>
  );
}
IdVerificationContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export {
  IdVerificationContext,
  IdVerificationContextProvider,
  MEDIA_ACCESS,
  ERROR_REASONS,
};
