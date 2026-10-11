#!/usr/bin/env bash
# EAS INSTALL_PODS fails with `spawn pod ENOENT` when the CocoaPods binstub
# shebang is `#!/usr/bin/env ruby` and the build-tools PATH has no ruby.
# Write wrappers that exec Ruby and the real gem with absolute paths.
set -euo pipefail

if [[ "${EAS_BUILD_PLATFORM:-}" != "ios" ]]; then
  exit 0
fi

echo "[stayverse] CocoaPods PATH diagnostic"
echo "PATH=${PATH}"
echo "which pod=$(command -v pod || echo NONE)"
echo "which ruby=$(command -v ruby || echo NONE)"
ruby -v || true

RUBY_BIN="$(command -v ruby || true)"
if [[ -z "${RUBY_BIN}" ]]; then
  for candidate in \
    /usr/bin/ruby \
    /opt/homebrew/opt/ruby@3.2/bin/ruby \
    /opt/homebrew/bin/ruby \
    /usr/local/bin/ruby
  do
    if [[ -x "${candidate}" ]]; then
      RUBY_BIN="${candidate}"
      break
    fi
  done
fi

POD_BIN="$(command -v pod || true)"
if [[ -z "${POD_BIN}" ]]; then
  for candidate in \
    /Users/expo/.gems/arm64/bin/pod \
    /Users/expo/.gems/bin/pod \
    /opt/homebrew/bin/pod \
    /usr/local/bin/pod
  do
    if [[ -x "${candidate}" ]]; then
      POD_BIN="${candidate}"
      break
    fi
  done
fi

if [[ -z "${POD_BIN}" ]]; then
  echo "[stayverse] installing CocoaPods 1.16.2"
  gem install cocoapods -v 1.16.2 --user-install
  POD_BIN="$(command -v pod || true)"
fi

echo "[stayverse] ruby=${RUBY_BIN:-NONE} pod=${POD_BIN:-NONE}"
if [[ -n "${POD_BIN}" ]]; then
  head -1 "${POD_BIN}" || true
fi

if [[ -z "${RUBY_BIN}" || -z "${POD_BIN}" ]]; then
  echo "[stayverse] missing ruby or pod; cannot write wrappers" >&2
  exit 0
fi

write_wrapper() {
  local dest="$1"
  mkdir -p "$(dirname "${dest}")"
  cat > "${dest}" <<WRAP
#!/bin/bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
exec "${RUBY_BIN}" "${POD_BIN}" "\$@"
WRAP
  chmod +x "${dest}"
  echo "[stayverse] wrote ${dest}"
}

write_wrapper /Users/expo/workingdir/bin/pod || true
write_wrapper "${HOME}/bin/pod" || true
write_wrapper "$(pwd)/bin/pod" || true
write_wrapper /opt/homebrew/bin/pod || true
write_wrapper /usr/local/bin/pod || true
if command -v sudo >/dev/null 2>&1; then
  tmp="$(mktemp)"
  write_wrapper "${tmp}"
  sudo cp "${tmp}" /usr/bin/pod 2>/dev/null || true
  sudo chmod +x /usr/bin/pod 2>/dev/null || true
  rm -f "${tmp}"
fi
