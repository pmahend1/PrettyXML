cmd_Release/obj.target/edge_coreclr/src/CoreCLREmbedding/coreclrembedding.o := c++ -o Release/obj.target/edge_coreclr/src/CoreCLREmbedding/coreclrembedding.o ../src/CoreCLREmbedding/coreclrembedding.cpp '-DNODE_GYP_MODULE_NAME=edge_coreclr' '-DUSING_UV_SHARED=1' '-DUSING_V8_SHARED=1' '-DV8_DEPRECATION_WARNINGS=1' '-DV8_DEPRECATION_WARNINGS' '-DV8_IMMINENT_DEPRECATION_WARNINGS' '-D_DARWIN_USE_64_BIT_INODE=1' '-D_LARGEFILE_SOURCE' '-D_FILE_OFFSET_BITS=64' '-DV8_COMPRESS_POINTERS' '-DV8_31BIT_SMIS_ON_64BIT_ARCH' '-DV8_REVERSE_JSARGS' '-DOPENSSL_NO_PINSHARED' '-DOPENSSL_THREADS' '-DBUILDING_NODE_EXTENSION' -I../src/CoreCLREmbedding/json/casablanca/include -I/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node -I/Users/prateekmahendrakar/.electron-gyp/11.2.1/src -I/Users/prateekmahendrakar/.electron-gyp/11.2.1/deps/openssl/config -I/Users/prateekmahendrakar/.electron-gyp/11.2.1/deps/openssl/openssl/include -I/Users/prateekmahendrakar/.electron-gyp/11.2.1/deps/uv/include -I/Users/prateekmahendrakar/.electron-gyp/11.2.1/deps/zlib -I/Users/prateekmahendrakar/.electron-gyp/11.2.1/deps/v8/include -I../node_modules/nan  -O3 -gdwarf-2 -mmacosx-version-min=10.7 -arch x86_64 -Wall -Wendif-labels -W -Wno-unused-parameter -std=c++14 -stdlib=libc++ -fno-strict-aliasing -DHAVE_CORECLR -D_NO_ASYNCRTIMP -Wno-reorder -Wno-sign-compare -Wno-mismatched-tags -Wno-missing-braces -Wno-redundant-move -Wno-deprecated-declarations -Wno-unused-private-field -Wno-unused-variable -MMD -MF ./Release/.deps/Release/obj.target/edge_coreclr/src/CoreCLREmbedding/coreclrembedding.o.d.raw   -c
Release/obj.target/edge_coreclr/src/CoreCLREmbedding/coreclrembedding.o: \
  ../src/CoreCLREmbedding/coreclrembedding.cpp \
  ../src/CoreCLREmbedding/edge.h \
  ../src/CoreCLREmbedding/../common/edge_common.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/v8.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/cppgc/common.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/v8config.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/v8-internal.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/v8-version.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/node.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/v8-platform.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/node_version.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/node_buffer.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/uv.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/uv/errno.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/uv/version.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/uv/unix.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/uv/threadpool.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/uv/darwin.h \
  ../node_modules/nan/nan.h \
  /Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/node_object_wrap.h \
  ../node_modules/nan/nan_callbacks.h \
  ../node_modules/nan/nan_callbacks_12_inl.h \
  ../node_modules/nan/nan_maybe_43_inl.h \
  ../node_modules/nan/nan_converters.h \
  ../node_modules/nan/nan_converters_43_inl.h \
  ../node_modules/nan/nan_new.h \
  ../node_modules/nan/nan_implementation_12_inl.h \
  ../node_modules/nan/nan_persistent_12_inl.h \
  ../node_modules/nan/nan_weak.h ../node_modules/nan/nan_object_wrap.h \
  ../node_modules/nan/nan_private.h \
  ../node_modules/nan/nan_typedarray_contents.h \
  ../node_modules/nan/nan_json.h ../src/CoreCLREmbedding/pal/pal.h \
  ../src/CoreCLREmbedding/pal/pal_utils.h \
  ../src/CoreCLREmbedding/pal/trace.h \
  ../src/CoreCLREmbedding/fxr/fx_ver.h \
  ../src/CoreCLREmbedding/fxr/../pal/pal.h \
  ../src/CoreCLREmbedding/json/casablanca/include/cpprest/json.h \
  ../src/CoreCLREmbedding/json/casablanca/include/cpprest/details/basic_types.h \
  ../src/CoreCLREmbedding/json/casablanca/include/cpprest/details/cpprest_compat.h \
  ../src/CoreCLREmbedding/json/casablanca/include/cpprest/details/nosal.h \
  ../src/CoreCLREmbedding/json/casablanca/include/cpprest/details/SafeInt3.hpp \
  ../src/CoreCLREmbedding/json/casablanca/include/cpprest/asyncrt_utils.h \
  ../src/CoreCLREmbedding/deps/deps_format.h \
  ../src/CoreCLREmbedding/deps/../pal/pal.h \
  ../src/CoreCLREmbedding/deps/deps_entry.h \
  ../src/CoreCLREmbedding/deps/deps_resolver.h \
  ../src/CoreCLREmbedding/deps/../host/args.h \
  ../src/CoreCLREmbedding/deps/../host/../pal/pal_utils.h \
  ../src/CoreCLREmbedding/deps/../host/../pal/pal.h \
  ../src/CoreCLREmbedding/deps/../host/../pal/trace.h \
  ../src/CoreCLREmbedding/deps/../host/../deps/deps_format.h \
  ../src/CoreCLREmbedding/deps/../host/libhost.h \
  ../src/CoreCLREmbedding/deps/../host/runtime_config.h \
  ../src/CoreCLREmbedding/deps/../host/../fxr/fx_ver.h \
  ../src/CoreCLREmbedding/deps/../pal/trace.h \
  ../src/CoreCLREmbedding/fxr/fx_muxer.h \
  ../src/CoreCLREmbedding/fxr/../host/libhost.h \
  ../src/CoreCLREmbedding/host/coreclr.h \
  ../src/CoreCLREmbedding/host/error_codes.h
../src/CoreCLREmbedding/coreclrembedding.cpp:
../src/CoreCLREmbedding/edge.h:
../src/CoreCLREmbedding/../common/edge_common.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/v8.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/cppgc/common.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/v8config.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/v8-internal.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/v8-version.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/node.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/v8-platform.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/node_version.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/node_buffer.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/uv.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/uv/errno.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/uv/version.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/uv/unix.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/uv/threadpool.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/uv/darwin.h:
../node_modules/nan/nan.h:
/Users/prateekmahendrakar/.electron-gyp/11.2.1/include/node/node_object_wrap.h:
../node_modules/nan/nan_callbacks.h:
../node_modules/nan/nan_callbacks_12_inl.h:
../node_modules/nan/nan_maybe_43_inl.h:
../node_modules/nan/nan_converters.h:
../node_modules/nan/nan_converters_43_inl.h:
../node_modules/nan/nan_new.h:
../node_modules/nan/nan_implementation_12_inl.h:
../node_modules/nan/nan_persistent_12_inl.h:
../node_modules/nan/nan_weak.h:
../node_modules/nan/nan_object_wrap.h:
../node_modules/nan/nan_private.h:
../node_modules/nan/nan_typedarray_contents.h:
../node_modules/nan/nan_json.h:
../src/CoreCLREmbedding/pal/pal.h:
../src/CoreCLREmbedding/pal/pal_utils.h:
../src/CoreCLREmbedding/pal/trace.h:
../src/CoreCLREmbedding/fxr/fx_ver.h:
../src/CoreCLREmbedding/fxr/../pal/pal.h:
../src/CoreCLREmbedding/json/casablanca/include/cpprest/json.h:
../src/CoreCLREmbedding/json/casablanca/include/cpprest/details/basic_types.h:
../src/CoreCLREmbedding/json/casablanca/include/cpprest/details/cpprest_compat.h:
../src/CoreCLREmbedding/json/casablanca/include/cpprest/details/nosal.h:
../src/CoreCLREmbedding/json/casablanca/include/cpprest/details/SafeInt3.hpp:
../src/CoreCLREmbedding/json/casablanca/include/cpprest/asyncrt_utils.h:
../src/CoreCLREmbedding/deps/deps_format.h:
../src/CoreCLREmbedding/deps/../pal/pal.h:
../src/CoreCLREmbedding/deps/deps_entry.h:
../src/CoreCLREmbedding/deps/deps_resolver.h:
../src/CoreCLREmbedding/deps/../host/args.h:
../src/CoreCLREmbedding/deps/../host/../pal/pal_utils.h:
../src/CoreCLREmbedding/deps/../host/../pal/pal.h:
../src/CoreCLREmbedding/deps/../host/../pal/trace.h:
../src/CoreCLREmbedding/deps/../host/../deps/deps_format.h:
../src/CoreCLREmbedding/deps/../host/libhost.h:
../src/CoreCLREmbedding/deps/../host/runtime_config.h:
../src/CoreCLREmbedding/deps/../host/../fxr/fx_ver.h:
../src/CoreCLREmbedding/deps/../pal/trace.h:
../src/CoreCLREmbedding/fxr/fx_muxer.h:
../src/CoreCLREmbedding/fxr/../host/libhost.h:
../src/CoreCLREmbedding/host/coreclr.h:
../src/CoreCLREmbedding/host/error_codes.h:
