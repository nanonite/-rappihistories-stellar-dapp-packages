{
  description = "Medichain TypeScript packages toolchain";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { nixpkgs
    , ...
    }:
    let
      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
      ];

      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;

      pkgsFor = system:
        import nixpkgs {
          inherit system;
        };

      packageDirs = [
        "crypto"
        "domain"
        "shared"
        "storage"
        "stellar-client"
        "test-fixtures"
        "wallet"
      ];

      packagesShellFor = system:
        let
          pkgs = pkgsFor system;
        in
        pkgs.mkShell {
          name = "medichain-packages";

          packages = with pkgs; [
            bashInteractive
            bun
            cacert
            git
            jq
            just
            nodejs_22
            nixpkgs-fmt
            typescript
          ];

          shellHook = ''
            echo "Medichain packages: Node $(node --version), Bun $(bun --version), TypeScript $(tsc --version | cut -d' ' -f2)"
          '';
        };
    in
    {
      devShells = forAllSystems
        (system: {
          default = packagesShellFor system;
          ci = packagesShellFor system;
        });

      checks = forAllSystems
        (system:
          let
            pkgs = pkgsFor system;
            packagesList = builtins.concatStringsSep " " packageDirs;
          in
          {
            packages-typecheck = pkgs.runCommand "medichain-packages-typecheck"
              {
                nativeBuildInputs = [
                  pkgs.bun
                  pkgs.typescript
                ];
                src = ./.;
              } ''
              cp -R "$src" ./source
              chmod -R u+w ./source

              for package_dir in ${packagesList}; do
                echo "typechecking $package_dir"
                (cd "./source/$package_dir" && tsc -b --pretty false)
              done

              (cd ./source/domain && bun test)
              (cd ./source/crypto && bun test)
              (cd ./source/storage && bun test)

              mkdir -p "$out"
            '';
          });

      formatter = forAllSystems (system: (pkgsFor system).nixpkgs-fmt);
    };
}
